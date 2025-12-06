
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams, notFound } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Loader2, UserPlus, Link as LinkIcon, ExternalLink, Check, CircleDot, Circle } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

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
  { id: 1, title: 'اختر نوع الحساب', description: 'حساب جديد أو موجود' },
  { id: 2, title: 'اتبع التعليمات', description: 'خطوات فتح أو ربط الحساب' },
  { id: 3, title: 'أدخل رقم الحساب', description: 'رقم حساب التداول الخاص بك' },
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
    if (currentStep === 1) fields.push('hasAccount');
    if (currentStep === 3) fields.push('accountNumber');

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
    if (currentStep > 1) setCurrentStep(step => step - 1);
  };

  const parseDescription = (desc: any, depth: number = 0): string => {
    if (depth > 10) return '';
    if (!desc) return '';
    if (typeof desc === 'string') {
      const trimmed = desc.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('"')) return desc;
      try { return parseDescription(JSON.parse(desc), depth + 1); } catch { return desc; }
    }
    if (Array.isArray(desc)) return desc.map(item => parseDescription(item, depth + 1)).filter(Boolean).join(' ');
    if (typeof desc === 'object') {
      for (const key of ['description', 'text', 'content', 'value', 'message']) {
        if (desc[key]) { const result = parseDescription(desc[key], depth + 1); if (result) return result; }
      }
      return '';
    }
    return String(desc);
  };

  const rawInstructions = broker.instructions || {};
  const newAccountDescription = parseDescription(rawInstructions.description) || `اضغط على الزر أدناه لفتح حساب تداول جديد مع ${brokerName}. بعد إنشاء الحساب، عد إلى هنا وأدخل رقم حسابك.`;
  const newAccountLink = rawInstructions.link || broker.cashback?.affiliate_program_link || '';
  const newAccountLinkText = rawInstructions.linkText || `فتح حساب مع ${brokerName}`;

  const getExistingAccountData = () => {
    const defaultText = `لربط حسابك الحالي مع ${brokerName}، يرجى التواصل مع فريق الدعم لنقل حسابك تحت شبكة شركائنا. بعد الموافقة، أدخل رقم حسابك في الخطوة التالية.`;
    const raw = broker.existingAccountInstructions;
    if (!raw) return { text: defaultText };
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            return { text: parsed.description || parsed.text || defaultText, linkText: parsed.linkText, link: parsed.link };
          }
          return { text: String(parsed) || defaultText };
        } catch { return { text: raw || defaultText }; }
      }
      return { text: raw || defaultText };
    }
    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as any;
      return { text: obj.description || obj.text || defaultText, linkText: obj.linkText, link: obj.link };
    }
    return { text: defaultText };
  };

  const existingAccountData = getExistingAccountData();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href={`/dashboard/brokers/${brokerId}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            إلغاء
          </Link>
          <div className="flex items-center gap-2">
            {broker.logoUrl && (
              <Image src={broker.logoUrl} alt={brokerName} width={24} height={24} className="w-6 h-6 object-contain rounded" />
            )}
            <span className="font-medium text-sm">{brokerName}</span>
          </div>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8">
          <div className="hidden md:block">
            <div className="sticky top-20 space-y-1">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 py-2">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      currentStep > step.id ? 'bg-primary text-primary-foreground' :
                      currentStep === step.id ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {currentStep > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`w-0.5 h-8 mt-1 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep > step.id ? 'bg-primary text-primary-foreground' :
                      currentStep === step.id ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground border'
                    }`}>
                      {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <p className={`text-[10px] mt-1 text-center max-w-[60px] ${currentStep >= step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-4 ${currentStep > step.id ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processForm)}>
                {currentStep === 1 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-1">هل لديك حساب تداول؟</h2>
                      <p className="text-sm text-muted-foreground mb-6">اختر الخيار المناسب لك</p>
                      
                      <FormField
                        control={form.control}
                        name="hasAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="space-y-3">
                                <button
                                  type="button"
                                  onClick={() => field.onChange('no')}
                                  className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                    field.value === 'no' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    field.value === 'no' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                  }`}>
                                    <UserPlus className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold">أريد فتح حساب جديد</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">سيتم توجيهك لإنشاء حساب تداول جديد</p>
                                  </div>
                                  {field.value === 'no' ? (
                                    <CircleDot className="h-5 w-5 text-primary flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => field.onChange('yes')}
                                  className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                    field.value === 'yes' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                  }`}
                                >
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    field.value === 'yes' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                  }`}>
                                    <LinkIcon className="h-5 w-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold">لدي حساب بالفعل</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">سأقوم بربط حسابي الحالي للحصول على الكاش باك</p>
                                  </div>
                                  {field.value === 'yes' ? (
                                    <CircleDot className="h-5 w-5 text-primary flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="mt-2" />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-1">
                        {hasAccountValue === 'no' ? 'فتح حساب جديد' : 'ربط حسابك الحالي'}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">اتبع الخطوات أدناه ثم انتقل للخطوة التالية</p>
                      
                      {hasAccountValue === 'no' && (
                        <div className="space-y-4">
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">1</div>
                              <div>
                                <p className="font-medium mb-1">افتح حساب تداول</p>
                                <p className="text-sm text-muted-foreground">{newAccountDescription}</p>
                              </div>
                            </div>
                            {newAccountLink && (
                              <Button asChild className="w-full mt-4">
                                <a href={newAccountLink} target="_blank" rel="noopener noreferrer">
                                  {newAccountLinkText}
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                </a>
                              </Button>
                            )}
                          </div>

                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground font-bold text-sm">2</div>
                              <div>
                                <p className="font-medium mb-1">احفظ رقم الحساب</p>
                                <p className="text-sm text-muted-foreground">بعد إنشاء حسابك، ستحصل على رقم حساب تداول. احفظه للخطوة التالية.</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted/50 rounded-xl p-4">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground font-bold text-sm">3</div>
                              <div>
                                <p className="font-medium mb-1">أكمل التسجيل</p>
                                <p className="text-sm text-muted-foreground">عد إلى هنا وأدخل رقم حسابك لبدء كسب الكاش باك.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {hasAccountValue === 'yes' && (
                        <div className="space-y-4">
                          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <LinkIcon className="h-4 w-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium mb-1">تعليمات الربط</p>
                                <p className="text-sm text-muted-foreground">{existingAccountData.text}</p>
                              </div>
                            </div>
                            {existingAccountData.link && (
                              <Button asChild variant="outline" className="w-full mt-4">
                                <a href={existingAccountData.link} target="_blank" rel="noopener noreferrer">
                                  {existingAccountData.linkText || 'اتبع الرابط'}
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 3 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-1">أدخل رقم الحساب</h2>
                      <p className="text-sm text-muted-foreground mb-6">أدخل رقم حساب التداول الخاص بك لإتمام الربط</p>
                      
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>رقم حساب التداول</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="مثال: 123456789" 
                                className="h-12 text-lg"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-muted-foreground mt-2">
                              ستجد رقم الحساب في لوحة تحكم منصة التداول أو في رسالة التأكيد الإلكترونية
                            </p>
                          </FormItem>
                        )}
                      />

                      <div className="mt-6 p-4 bg-muted/50 rounded-xl">
                        <p className="text-sm font-medium mb-2">ملخص الطلب</p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الوسيط</span>
                            <span className="font-medium">{brokerName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">نوع الربط</span>
                            <span className="font-medium">{hasAccountValue === 'no' ? 'حساب جديد' : 'حساب موجود'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-3 mt-6">
                  {currentStep > 1 && !action && (
                    <Button type="button" onClick={prev} variant="outline" size="lg" className="flex-1">
                      السابق
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    onClick={next} 
                    disabled={
                      isSubmitting || 
                      (currentStep === 1 && !hasAccountValue) ||
                      (currentStep === 3 && (!form.watch('accountNumber') || form.watch('accountNumber').length < 5))
                    } 
                    size="lg" 
                    className={currentStep > 1 && !action ? "flex-1" : "w-full"}
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    {currentStep === STEPS.length ? 'إرسال الطلب' : 'متابعة'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrokerPageSkeleton() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-center">
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-[200px_1fr] gap-8">
          <div className="hidden md:block space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-12 w-full mt-6 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
