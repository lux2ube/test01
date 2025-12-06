"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams, notFound } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { createClient } from '@/lib/supabase/client';
import { submitTradingAccount } from '@/app/actions';
import type { Broker } from '@/types';
import { Loader2, UserPlus, Link as LinkIcon, ExternalLink, Check, ArrowRight, ArrowLeft, X } from 'lucide-react';
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
  { id: 1, title: 'نوع الحساب' },
  { id: 2, title: 'التعليمات' },
  { id: 3, title: 'التأكيد' },
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
        const { data, error } = await supabase.from('brokers').select('*').eq('id', brokerId).single();
        if (error || !data) { notFound(); } 
        else { setBroker(transformBrokerFromDB(data)); }
      } catch { notFound(); } 
      finally { setIsBrokerLoading(false); }
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
    if (action === 'existing') { form.setValue('hasAccount', 'yes'); if (currentStep === 1) setCurrentStep(2); }
    else if (action === 'new') { form.setValue('hasAccount', 'no'); if (currentStep === 1) setCurrentStep(2); }
  }, [action, form, currentStep]);

  const hasAccountValue = form.watch("hasAccount");
  const accountNumber = form.watch("accountNumber");

  if (isBrokerLoading) return <PageSkeleton />;
  if (!broker) notFound();

  const brokerName = broker.name || broker.basicInfo?.broker_name;

  const processForm = async (data: FormData) => {
    if (!user) { toast({ variant: 'destructive', title: 'خطأ', description: 'يجب تسجيل الدخول.' }); return; }
    setIsSubmitting(true);
    try {
      const result = await submitTradingAccount(brokerId, brokerName, data.accountNumber);
      if (result.success) { toast({ title: 'نجاح!', description: result.message }); router.push('/dashboard/my-accounts'); }
      else { toast({ variant: 'destructive', title: 'خطأ', description: result.message }); }
    } catch { toast({ variant: 'destructive', title: 'خطأ', description: 'حدثت مشكلة. حاول مرة أخرى.' }); }
    finally { setIsSubmitting(false); }
  };

  const canProceed = () => {
    if (currentStep === 1) return !!hasAccountValue;
    if (currentStep === 2) return true;
    if (currentStep === 3) return accountNumber && accountNumber.length >= 5;
    return false;
  };

  const next = async () => {
    if (currentStep === 1) {
      const valid = await form.trigger('hasAccount');
      if (!valid) return;
    }
    if (currentStep === 3) {
      const valid = await form.trigger('accountNumber');
      if (!valid) return;
      await form.handleSubmit(processForm)();
      return;
    }
    setCurrentStep(s => Math.min(s + 1, 3));
  };

  const prev = () => setCurrentStep(s => Math.max(s - 1, 1));

  const parseDesc = (desc: any, d = 0): string => {
    if (d > 10 || !desc) return '';
    if (typeof desc === 'string') {
      if (!desc.trim().startsWith('{') && !desc.trim().startsWith('[')) return desc;
      try { return parseDesc(JSON.parse(desc), d + 1); } catch { return desc; }
    }
    if (Array.isArray(desc)) return desc.map(i => parseDesc(i, d + 1)).filter(Boolean).join(' ');
    if (typeof desc === 'object') {
      for (const k of ['description', 'text', 'content']) { if (desc[k]) { const r = parseDesc(desc[k], d + 1); if (r) return r; } }
    }
    return String(desc);
  };

  const instructions = broker.instructions || {};
  const newDesc = parseDesc(instructions.description) || `افتح حساب جديد مع ${brokerName} عبر الرابط أدناه.`;
  const newLink = instructions.link || broker.cashback?.affiliate_program_link || '';

  const getExistingData = () => {
    const def = `تواصل مع الدعم لربط حسابك الحالي مع ${brokerName}.`;
    const raw = broker.existingAccountInstructions;
    if (!raw) return { text: def };
    if (typeof raw === 'string') {
      if (raw.trim().startsWith('{')) {
        try { 
          const p = JSON.parse(raw); 
          return { 
            text: p.description || p.text || def, 
            link: p.link, 
            linkText: p.linkText || p.link_text 
          }; 
        } catch { return { text: raw }; }
      }
      return { text: raw };
    }
    if (typeof raw === 'object') {
      const obj = raw as any;
      return { 
        text: obj.description || obj.text || def, 
        link: obj.link, 
        linkText: obj.linkText || obj.link_text 
      };
    }
    return { text: def };
  };
  const existingData = getExistingData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card sticky top-0 z-10">
        <Link href={`/dashboard/brokers/${brokerId}`} className="p-1 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          {broker.logoUrl && (
            <Image src={broker.logoUrl} alt="" width={24} height={24} className="w-6 h-6 object-contain rounded" />
          )}
          <span className="font-medium text-sm">{brokerName}</span>
        </div>
        <div className="w-7" />
      </div>

      {/* Step Progress Bar */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep > step.id 
                    ? 'bg-green-500 text-white' 
                    : currentStep === step.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className={`text-xs font-medium mt-1 ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-8 h-1 rounded mt-[-16px] ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-sm mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processForm)} className="space-y-4">
              
              {/* Step 1: Account Type Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-center">هل لديك حساب مع {brokerName}؟</h2>
                  <FormField
                    control={form.control}
                    name="hasAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="grid gap-3">
                            <button
                              type="button"
                              onClick={() => field.onChange('no')}
                              className={`w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 transition-all ${
                                field.value === 'no' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                field.value === 'no' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <UserPlus className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">فتح حساب جديد</p>
                                <p className="text-xs text-muted-foreground">سأنشئ حساب تداول جديد</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                field.value === 'no' ? 'border-primary bg-primary' : 'border-gray-300'
                              }`}>
                                {field.value === 'no' && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => field.onChange('yes')}
                              className={`w-full p-4 rounded-xl border-2 text-right flex items-center gap-3 transition-all ${
                                field.value === 'yes' 
                                  ? 'border-primary bg-primary/5' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                field.value === 'yes' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'
                              }`}>
                                <LinkIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">ربط حساب موجود</p>
                                <p className="text-xs text-muted-foreground">لدي حساب بالفعل</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                field.value === 'yes' ? 'border-primary bg-primary' : 'border-gray-300'
                              }`}>
                                {field.value === 'yes' && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Instructions */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-center">
                    {hasAccountValue === 'no' ? 'خطوات فتح الحساب' : 'تعليمات ربط الحساب'}
                  </h2>
                  
                  {hasAccountValue === 'no' ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">1</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">افتح حساب تداول</p>
                            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line break-words">{newDesc}</p>
                            {newLink && (
                              <Button asChild size="sm" className="mt-2 h-8 text-xs w-full">
                                <a href={newLink} target="_blank" rel="noopener noreferrer">
                                  فتح رابط التسجيل
                                  <ExternalLink className="w-3 h-3 me-1" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0">2</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">أكمل التسجيل</p>
                            <p className="text-xs text-muted-foreground mt-1">أكمل نموذج التسجيل واحفظ رقم الحساب</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold flex items-center justify-center flex-shrink-0">3</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">عد وأدخل رقم الحساب</p>
                            <p className="text-xs text-muted-foreground mt-1">في الخطوة التالية أدخل رقم حسابك الجديد</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <p className="font-semibold text-sm">تعليمات مهمة</p>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-line break-words leading-relaxed">
                          {existingData.text}
                        </p>
                        {existingData.link && (
                          <Button asChild variant="outline" size="sm" className="h-10 text-sm w-full">
                            <a href={existingData.link} target="_blank" rel="noopener noreferrer">
                              {existingData.linkText || 'فتح الرابط'}
                              <ExternalLink className="w-4 h-4 me-2" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Account Number */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-center">أدخل رقم حساب التداول</h2>
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="مثال: 123456789" 
                            className="h-12 text-center text-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          ستجد رقم الحساب في منصة التداول أو البريد الإلكتروني من الوسيط
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">ملخص الطلب</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الوسيط</span>
                      <span className="font-medium">{brokerName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">نوع الربط</span>
                      <span className="font-medium">{hasAccountValue === 'no' ? 'حساب جديد' : 'حساب موجود'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS - INLINE WITH CONTENT */}
              <div className="pt-6 mt-6 border-t">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={prev}
                      className="flex-1 h-14 text-base font-semibold"
                    >
                      <ArrowRight className="w-5 h-5 me-2" />
                      السابق
                    </Button>
                  )}
                  <Button 
                    type="button" 
                    onClick={next}
                    disabled={isSubmitting || !canProceed()}
                    className={`h-14 text-base font-semibold ${currentStep === 1 ? 'w-full' : 'flex-1'}`}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : currentStep === 3 ? (
                      'إرسال الطلب'
                    ) : (
                      <>
                        التالي
                        <ArrowLeft className="w-5 h-5 ms-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-3 border-b flex items-center justify-center">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-3 border-b">
        <Skeleton className="h-14 w-full max-w-xs mx-auto" />
      </div>
      <div className="p-4">
        <div className="max-w-sm mx-auto space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-full mt-6" />
        </div>
      </div>
    </div>
  );
}
