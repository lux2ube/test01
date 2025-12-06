
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
import { Loader2, UserPlus, Link as LinkIcon, ExternalLink, Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
        try { const p = JSON.parse(raw); return { text: p.description || p.text || def, link: p.link, linkText: p.linkText }; } catch { return { text: raw }; }
      }
      return { text: raw };
    }
    if (typeof raw === 'object') return { text: (raw as any).description || (raw as any).text || def, link: (raw as any).link, linkText: (raw as any).linkText };
    return { text: def };
  };
  const existingData = getExistingData();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-2 flex items-center justify-between sticky top-0 bg-background z-20">
        <Link href={`/dashboard/brokers/${brokerId}`} className="p-1.5 -m-1.5 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          {broker.logoUrl && <Image src={broker.logoUrl} alt="" width={20} height={20} className="w-5 h-5 object-contain rounded" />}
          <span className="text-sm font-medium">{brokerName}</span>
        </div>
        <div className="w-8" />
      </header>

      <div className="px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {[1, 2, 3].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  currentStep > step ? 'bg-primary text-primary-foreground' :
                  currentStep === step ? 'bg-primary text-primary-foreground' :
                  'bg-muted-foreground/20 text-muted-foreground'
                }`}>
                  {currentStep > step ? <Check className="h-3 w-3" /> : step}
                </div>
                <span className={`text-xs hidden sm:inline ${currentStep >= step ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step === 1 ? 'اختيار' : step === 2 ? 'تعليمات' : 'تأكيد'}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-px mx-2 ${currentStep > step ? 'bg-primary' : 'bg-border'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-md mx-auto px-4 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(processForm)}>
              {currentStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center mb-4">هل لديك حساب مع {brokerName}؟</p>
                  <FormField
                    control={form.control}
                    name="hasAccount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => field.onChange('no')}
                              className={`w-full text-right p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                field.value === 'no' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                field.value === 'no' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                <UserPlus className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">فتح حساب جديد</p>
                                <p className="text-[11px] text-muted-foreground">سأنشئ حساب تداول جديد</p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                field.value === 'no' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                              }`}>
                                {field.value === 'no' && <Check className="h-full w-full text-primary-foreground p-0.5" />}
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => field.onChange('yes')}
                              className={`w-full text-right p-3 rounded-lg border transition-all flex items-center gap-3 ${
                                field.value === 'yes' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                field.value === 'yes' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                <LinkIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">ربط حساب موجود</p>
                                <p className="text-[11px] text-muted-foreground">لدي حساب بالفعل</p>
                              </div>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                                field.value === 'yes' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                              }`}>
                                {field.value === 'yes' && <Check className="h-full w-full text-primary-foreground p-0.5" />}
                              </div>
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs mt-1" />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center mb-2">
                    {hasAccountValue === 'no' ? 'اتبع الخطوات التالية' : 'تعليمات الربط'}
                  </p>
                  
                  {hasAccountValue === 'no' ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">1</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">افتح حساب تداول</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{newDesc}</p>
                          </div>
                        </div>
                        {newLink && (
                          <Button asChild size="sm" className="w-full mt-2 h-8 text-xs">
                            <a href={newLink} target="_blank" rel="noopener noreferrer">
                              فتح الرابط <ExternalLink className="h-3 w-3 mr-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center flex-shrink-0">2</span>
                          <div>
                            <p className="text-xs font-medium">احفظ رقم الحساب</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">ستحتاجه في الخطوة التالية</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex gap-2">
                        <LinkIcon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium">تعليمات مهمة</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{existingData.text}</p>
                        </div>
                      </div>
                      {existingData.link && (
                        <Button asChild variant="outline" size="sm" className="w-full mt-2 h-8 text-xs">
                          <a href={existingData.link} target="_blank" rel="noopener noreferrer">
                            {existingData.linkText || 'فتح الرابط'} <ExternalLink className="h-3 w-3 mr-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-center mb-2">أدخل رقم الحساب</p>
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="رقم حساب التداول" className="h-10 text-center" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs" />
                        <p className="text-[11px] text-muted-foreground text-center">ستجده في منصة التداول أو البريد الإلكتروني</p>
                      </FormItem>
                    )}
                  />
                  <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">الوسيط</span><span className="font-medium">{brokerName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">النوع</span><span className="font-medium">{hasAccountValue === 'no' ? 'جديد' : 'موجود'}</span></div>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 z-20">
        <div className="max-w-md mx-auto flex gap-2">
          {currentStep > 1 && !action && (
            <Button type="button" onClick={prev} variant="outline" className="flex-1 h-10">
              <ChevronRight className="h-4 w-4 ml-1" />
              السابق
            </Button>
          )}
          <Button 
            type="button" 
            onClick={next} 
            disabled={isSubmitting || !canProceed()} 
            className={`h-10 ${currentStep > 1 && !action ? 'flex-1' : 'w-full'}`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                {currentStep === 3 ? 'إرسال' : 'التالي'}
                {currentStep < 3 && <ChevronLeft className="h-4 w-4 mr-1" />}
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b px-4 py-2 flex justify-center"><Skeleton className="h-5 w-24" /></div>
      <div className="px-4 py-2 border-b"><Skeleton className="h-6 w-full max-w-md mx-auto" /></div>
      <div className="flex-1 p-4"><div className="max-w-md mx-auto space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div></div>
    </div>
  );
}
