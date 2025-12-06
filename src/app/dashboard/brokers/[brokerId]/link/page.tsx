
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams, notFound } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { createClient } from '@/lib/supabase/client';
import { submitTradingAccount } from '@/app/actions';
import type { Broker } from '@/types';
import { Loader2, UserPlus, FileText, Link as LinkIcon, ExternalLink, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

function transformBrokerFromDB(dbBroker: any): Broker {
  return {
    id: dbBroker.id,
    order: dbBroker.order,
    logoUrl: dbBroker.logo_url || dbBroker.logoUrl || "",
    basicInfo: dbBroker.basic_info || dbBroker.basicInfo || {},
    regulation: dbBroker.regulation || {},
    tradingConditions: dbBroker.trading_conditions || dbBroker.tradingConditions || {},
    platforms: dbBroker.platforms || {},
    instruments: dbBroker.instruments || {},
    depositsWithdrawals: dbBroker.deposits_withdrawals || dbBroker.depositsWithdrawals || {},
    cashback: dbBroker.cashback || {},
    globalReach: dbBroker.global_reach || dbBroker.globalReach || {},
    reputation: dbBroker.reputation || {},
    additionalFeatures: dbBroker.additional_features || dbBroker.additionalFeatures || {},
    name: dbBroker.name || "Unknown Broker",
    description: dbBroker.description || "",
    category: dbBroker.category || "other",
    rating: dbBroker.rating || 0,
    instructions: dbBroker.instructions || {},
    existingAccountInstructions: dbBroker.existing_account_instructions || dbBroker.existingAccountInstructions || "",
  };
}

const formSchema = z.object({
  hasAccount: z.enum(["yes", "no"], { required_error: "يرجى تحديد خيار." }),
  accountNumber: z.string().min(5, { message: 'يجب أن يكون رقم الحساب 5 أحرف على الأقل.' }),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: 'اختر المسار' },
  { id: 2, title: 'اتبع التعليمات' },
  { id: 3, title: 'أدخل رقم الحساب' },
];

export default function BrokerLinkPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isBrokerLoading, setIsBrokerLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const action = searchParams.get('action');

  const brokerId = params.brokerId as string;

  useEffect(() => {
    const fetchBroker = async () => {
      if (!brokerId) return;
      setIsBrokerLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('brokers')
          .select('*')
          .eq('id', brokerId)
          .single();
        
        if (error || !data) {
          notFound();
        } else {
          const transformedBroker = transformBrokerFromDB(data);
          setBroker(transformedBroker);
        }
      } catch (error) {
        console.error("Error fetching broker", error);
        notFound();
      } finally {
        setIsBrokerLoading(false);
      }
    };
    fetchBroker();
  }, [brokerId]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasAccount: action === 'existing' ? 'yes' : action === 'new' ? 'no' : undefined,
      accountNumber: '',
    },
  });

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'existing') {
        form.setValue('hasAccount', 'yes');
        if (currentStep === 1) setCurrentStep(2);
    } else if (action === 'new') {
        form.setValue('hasAccount', 'no');
        if (currentStep === 1) setCurrentStep(2);
    }
  }, [searchParams, form, currentStep]);


  const hasAccountValue = form.watch("hasAccount");

  if (isBrokerLoading) {
    return <BrokerPageSkeleton />
  }

  if (!broker) {
    notFound();
  }

  const brokerName = broker.name || broker.basicInfo?.broker_name;

  const processForm = async (data: FormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'يجب عليك تسجيل الدخول لإضافة حساب.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitTradingAccount(brokerId, brokerName, data.accountNumber);
      
      if (result.success) {
        toast({ title: 'نجاح!', description: result.message });
        router.push('/dashboard/my-accounts');
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: result.message });
      }
    } catch (error) {
      console.error('Error submitting account: ', error);
      toast({ variant: 'destructive', title: 'خطأ', description: 'حدثت مشكلة أثناء تقديم حسابك. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  type FieldName = keyof FormData;

  const next = async () => {
    const fields: FieldName[] = [];
    if (currentStep === 1) {
        fields.push('hasAccount');
    }
    if (currentStep === 3) {
        fields.push('accountNumber');
    }

    if (fields.length > 0) {
      const output = await form.trigger(fields as FieldName[], { shouldFocus: true });
      if (!output) return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(step => step + 1);
    } else {
      await form.handleSubmit(processForm)();
    }
  };

  const prev = () => {
    if (currentStep > 1) {
      setCurrentStep(step => step - 1);
    }
  };

  const progressPercent = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col max-w-lg mx-auto w-full px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" asChild size="sm" className="h-8 px-2 text-muted-foreground">
          <Link href={`/dashboard/brokers/${brokerId}`}>
            <ArrowRight className="h-4 w-4 ml-1" />
            رجوع
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {broker.logoUrl && (
            <Image
              src={broker.logoUrl}
              alt={brokerName}
              width={24}
              height={24}
              className="w-6 h-6 object-contain rounded"
            />
          )}
          <span className="text-sm font-medium">{brokerName}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>الخطوة {currentStep} من {STEPS.length}</span>
          <span>{STEPS[currentStep - 1].title}</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(processForm)} className="flex-1 flex flex-col">
          <div className="flex-1 pb-24">
            {currentStep === 1 && <Step1 brokerName={brokerName} />}
            {currentStep === 2 && <Step2 hasAccount={hasAccountValue} broker={broker} />}
            {currentStep === 3 && <Step3 />}
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
            <div className="max-w-lg mx-auto px-4 py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{STEPS[currentStep - 1].title}</span>
                <span>{currentStep} / {STEPS.length}</span>
              </div>
              <div className="flex gap-2">
                {currentStep > 1 && !action && (
                  <Button type="button" onClick={prev} variant="outline" size="lg" className="flex-1">
                    <ArrowRight className="h-4 w-4 ml-1" />
                    السابق
                  </Button>
                )}
                <Button type="button" onClick={next} disabled={isSubmitting} size="lg" className={currentStep > 1 && !action ? "flex-1" : "w-full"}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  {currentStep === STEPS.length ? (
                    <>
                      <Check className="h-4 w-4 ml-1" />
                      إرسال
                    </>
                  ) : (
                    <>
                      التالي
                      <ArrowLeft className="h-4 w-4 mr-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

function Step1({ brokerName }: { brokerName: string }) {
  const { control } = useFormContext();
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold">هل لديك حساب مع {brokerName}؟</h2>
        <p className="text-sm text-muted-foreground mt-1">اختر الخيار المناسب للمتابعة</p>
      </div>
      
      <FormField
        control={control}
        name="hasAccount"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-3">
                <label htmlFor="no" className="cursor-pointer">
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${field.value === 'no' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                    <RadioGroupItem value="no" id="no" className="sr-only" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${field.value === 'no' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">لا، أريد فتح حساب جديد</p>
                      <p className="text-xs text-muted-foreground">سنوجهك لإنشاء حساب جديد</p>
                    </div>
                    {field.value === 'no' && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </label>
                
                <label htmlFor="yes" className="cursor-pointer">
                  <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${field.value === 'yes' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                    <RadioGroupItem value="yes" id="yes" className="sr-only" />
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${field.value === 'yes' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">نعم، لدي حساب بالفعل</p>
                      <p className="text-xs text-muted-foreground">سنربط حسابك الحالي</p>
                    </div>
                    {field.value === 'yes' && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function Step2({ hasAccount, broker }: { hasAccount: string | undefined; broker: Broker }) {
  const brokerName = broker.name || broker.basicInfo?.broker_name;
  
  const parseDescription = (desc: any, depth: number = 0): string => {
    if (depth > 10) return '';
    if (!desc) return '';
    if (desc === null || desc === undefined) return '';
    
    if (typeof desc === 'string') {
      const trimmed = desc.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) {
        return desc;
      }
      try {
        const parsed = JSON.parse(desc);
        return parseDescription(parsed, depth + 1);
      } catch (e) {
        return desc;
      }
    }
    
    if (Array.isArray(desc)) {
      return desc.map(item => parseDescription(item, depth + 1)).filter(Boolean).join(' ');
    }
    
    if (typeof desc === 'object') {
      const textKeys = ['description', 'text', 'content', 'value', 'message'];
      for (const key of textKeys) {
        if (desc[key] !== undefined && desc[key] !== null) {
          const result = parseDescription(desc[key], depth + 1);
          if (result) return result;
        }
      }
      return '';
    }
    
    return String(desc);
  };
  
  const rawInstructions = broker.instructions || {};
  const description = parseDescription(rawInstructions.description) || "اتبع الرابط لفتح حساب جديد.";
  const link = rawInstructions.link || broker.cashback?.affiliate_program_link || '';
  const linkText = rawInstructions.linkText || `افتح حسابًا مع ${brokerName}`;
  
  const getExistingAccountData = (): { text: string; linkText?: string; link?: string } => {
    const defaultText = "يرجى الاتصال بالدعم لربط حسابك الحالي تحت شبكة شركائنا.";
    const raw = broker.existingAccountInstructions;
    
    if (!raw) return { text: defaultText };
    
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            return {
              text: parsed.description || parsed.text || defaultText,
              linkText: parsed.linkText,
              link: parsed.link
            };
          }
          return { text: String(parsed) || defaultText };
        } catch (e) {
          return { text: raw || defaultText };
        }
      }
      return { text: raw || defaultText };
    }
    
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as any;
      return {
        text: obj.description || obj.text || defaultText,
        linkText: obj.linkText,
        link: obj.link
      };
    }
    
    return { text: defaultText };
  };
  
  const existingAccountData = getExistingAccountData();

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold">
          {hasAccount === 'no' ? 'إنشاء حساب جديد' : 'ربط حسابك الحالي'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">اتبع التعليمات أدناه ثم انتقل للخطوة التالية</p>
      </div>
      
      {hasAccount === 'no' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">خطوات فتح الحساب</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
            {link && (
              <Button asChild className="w-full">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {linkText}
                  <ExternalLink className="h-4 w-4 mr-2" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      
      {hasAccount === 'yes' && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm mb-1">تعليمات مهمة</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{existingAccountData.text}</p>
              </div>
            </div>
            {existingAccountData.link && (
              <Button asChild variant="outline" className="w-full">
                <a href={existingAccountData.link} target="_blank" rel="noopener noreferrer">
                  {existingAccountData.linkText || 'اتبع الرابط'}
                  <ExternalLink className="h-4 w-4 mr-2" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Step3() {
  const { control } = useFormContext();
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold">أدخل رقم الحساب</h2>
        <p className="text-sm text-muted-foreground mt-1">أدخل رقم حساب التداول الخاص بك لربطه</p>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <FormField
            control={control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">رقم حساب التداول</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="مثال: 123456789" 
                    className="text-center text-lg h-12"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ستجد رقم الحساب في لوحة تحكم منصة التداول الخاصة بك
                </p>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BrokerPageSkeleton() {
  return (
    <div className="max-w-lg mx-auto w-full px-4 py-4 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-8 w-48 mx-auto" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  )
}
