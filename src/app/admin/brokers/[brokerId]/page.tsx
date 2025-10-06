"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAutosave } from "@/hooks/use-autosave";
import type { Broker } from "@/types";
import { addBroker, updateBroker } from "@/app/admin/manage-brokers/actions";
import { createClient } from "@/lib/supabase/client";
import { BrokerFormWizard } from "@/components/broker-form/BrokerFormWizard";
import type { WizardStep } from "@/components/broker-form/BrokerFormWizard";
import {
  BasicInfoStep,
  RegulationStep,
  TradingConditionsStep,
  PlatformsStep,
  InstrumentsStep,
  DepositsWithdrawalsStep,
  CashbackStep,
  GlobalReachStep,
  ReputationStep,
  AdditionalFeaturesStep,
  InstructionsStep,
} from "@/components/broker-form/steps";

function transformBrokerFromDB(dbBroker: any): Broker {
  return {
    id: dbBroker.id,
    order: dbBroker.order,
    logoUrl: dbBroker.logo_url || dbBroker.logoUrl,
    basicInfo: dbBroker.basic_info || dbBroker.basicInfo,
    regulation: dbBroker.regulation,
    tradingConditions: dbBroker.trading_conditions || dbBroker.tradingConditions,
    platforms: dbBroker.platforms,
    instruments: dbBroker.instruments,
    depositsWithdrawals: dbBroker.deposits_withdrawals || dbBroker.depositsWithdrawals,
    cashback: dbBroker.cashback,
    globalReach: dbBroker.global_reach || dbBroker.globalReach,
    reputation: dbBroker.reputation,
    additionalFeatures: dbBroker.additional_features || dbBroker.additionalFeatures,
    name: dbBroker.name,
    description: dbBroker.description,
    category: dbBroker.category,
    rating: dbBroker.rating,
    instructions: dbBroker.instructions,
    existingAccountInstructions: dbBroker.existing_account_instructions || dbBroker.existingAccountInstructions,
  };
}

function transformFormToBroker(formValues: BrokerFormValues): any {
  return {
    logoUrl: formValues.logoUrl,
    category: formValues.category,
    description: formValues.description,
    name: formValues.basicInfo.broker_name,
    rating: Math.round(formValues.reputation.wikifx_score ? formValues.reputation.wikifx_score / 2 : 0),
    
    basicInfo: {
      broker_name: formValues.basicInfo.broker_name,
      year_founded: formValues.basicInfo.year_founded || formValues.basicInfo.founded_year,
      headquarters: formValues.basicInfo.headquarters,
      website: formValues.basicInfo.website,
      company_name: formValues.basicInfo.company_name,
      group_entity: formValues.basicInfo.group_entity,
      founded_year: formValues.basicInfo.founded_year,
      CEO: formValues.basicInfo.CEO,
      broker_type: formValues.basicInfo.broker_type,
    },
    
    regulation: {
      is_regulated: formValues.regulation.is_regulated,
      licenses: formValues.regulation.licenses,
      regulatory_bodies: formValues.regulation.regulatory_bodies,
      investor_protection: formValues.regulation.investor_protection,
      regulation_status: formValues.regulation.regulation_status,
      offshore_regulation: formValues.regulation.offshore_regulation,
      risk_level: formValues.regulation.risk_level,
      regulated_in: formValues.regulation.regulated_in,
      regulator_name: formValues.regulation.regulator_name,
    },
    
    tradingConditions: {
      minimum_deposit: formValues.tradingConditions.minimum_deposit || formValues.tradingConditions.min_deposit,
      maximum_leverage: formValues.tradingConditions.maximum_leverage || formValues.tradingConditions.max_leverage,
      spreads_from: formValues.tradingConditions.spreads_from || formValues.tradingConditions.min_spread,
      commission: formValues.tradingConditions.commission,
      account_types: formValues.tradingConditions.account_types,
      execution_type: formValues.tradingConditions.execution_type,
      base_currency: formValues.tradingConditions.base_currency,
      max_leverage: formValues.tradingConditions.max_leverage,
      min_deposit: formValues.tradingConditions.min_deposit,
      spread_type: formValues.tradingConditions.spread_type,
      min_spread: formValues.tradingConditions.min_spread,
      commission_per_lot: formValues.tradingConditions.commission_per_lot,
      execution_speed: formValues.tradingConditions.execution_speed,
    },
    
    platforms: {
      trading_platforms: formValues.platforms.trading_platforms,
      mobile_trading: formValues.platforms.mobile_trading,
      demo_account: formValues.platforms.demo_account,
      copy_trading: formValues.platforms.copy_trading,
      platforms_supported: formValues.platforms.platforms_supported,
      mt4_license_type: formValues.platforms.mt4_license_type,
      mt5_license_type: formValues.platforms.mt5_license_type,
      custom_platform: formValues.platforms.custom_platform,
    },
    
    instruments: {
      forex_pairs: formValues.instruments.forex_pairs,
      crypto_trading: formValues.instruments.crypto_trading,
      stocks: formValues.instruments.stocks,
      commodities: formValues.instruments.commodities,
      indices: formValues.instruments.indices,
    },
    
    depositsWithdrawals: {
      payment_methods: formValues.depositsWithdrawals.payment_methods,
      min_withdrawal: formValues.depositsWithdrawals.min_withdrawal,
      withdrawal_speed: formValues.depositsWithdrawals.withdrawal_speed,
      deposit_fees: formValues.depositsWithdrawals.deposit_fees,
      withdrawal_fees: formValues.depositsWithdrawals.withdrawal_fees,
    },
    
    cashback: {
      offers_cashback: formValues.cashback.offers_cashback,
      cashback_amount: formValues.cashback.cashback_amount,
      cashback_currency: formValues.cashback.cashback_currency,
      cashback_frequency: formValues.cashback.cashback_frequency,
      minimum_withdrawal: formValues.cashback.minimum_withdrawal,
      eligible_instruments: formValues.cashback.eligible_instruments,
      terms_and_conditions: formValues.cashback.terms_and_conditions,
      affiliate_program_link: formValues.cashback.affiliate_program_link,
      cashback_account_type: formValues.cashback.cashback_account_type,
      rebate_method: formValues.cashback.rebate_method,
      cashback_per_lot: formValues.cashback.cashback_per_lot,
    },
    
    globalReach: {
      business_region: formValues.globalReach.business_region,
      global_presence: formValues.globalReach.global_presence,
      languages_supported: formValues.globalReach.languages_supported,
      customer_support_channels: formValues.globalReach.customer_support_channels,
    },
    
    reputation: {
      wikifx_score: formValues.reputation.wikifx_score,
      trustpilot_rating: formValues.reputation.trustpilot_rating,
      reviews_count: formValues.reputation.reviews_count,
      verified_users: formValues.reputation.verified_users,
    },
    
    additionalFeatures: {
      swap_free: formValues.additionalFeatures.swap_free,
      education_center: formValues.additionalFeatures.education_center,
      copy_trading: formValues.additionalFeatures.copy_trading,
      demo_account: formValues.additionalFeatures.demo_account,
      trading_contests: formValues.additionalFeatures.trading_contests,
      regulatory_alerts: formValues.additionalFeatures.regulatory_alerts,
      welcome_bonus: formValues.additionalFeatures.welcome_bonus,
    },
    
    instructions: {
      description: formValues.instructions.description,
      new_account_instructions: formValues.instructions.new_account_instructions,
      new_account_link: formValues.instructions.new_account_link,
      new_account_link_text: formValues.instructions.new_account_link_text,
      linkText: formValues.instructions.new_account_link_text,
      link: formValues.instructions.new_account_link,
    },
    
    existingAccountInstructions: formValues.existingAccountInstructions,
  };
}

const licenseSchema = z.object({
  authority: z.string().min(1, "جهة الترخيص مطلوبة"),
  licenseNumber: z.string().optional(),
  status: z.string().min(1, "حالة الترخيص مطلوبة"),
});

const formSchema = z.object({
  logoUrl: z.string().url("يجب أن يكون رابطًا صالحًا.").or(z.literal("")).transform(val => val || "https://placehold.co/100x100.png").default("https://placehold.co/100x100.png"),
  category: z.enum(['forex', 'crypto', 'other']).default('forex'),
  description: z.string().optional().default(""),
  
  basicInfo: z.object({
    broker_name: z.string().min(2, "اسم الوسيط مطلوب."),
    year_founded: z.coerce.number().optional(),
    headquarters: z.string().optional().default(""),
    website: z.string().url().optional().or(z.literal("")).default(""),
    company_name: z.string().optional().default(""),
    group_entity: z.string().optional().default(""),
    founded_year: z.coerce.number().optional().default(new Date().getFullYear()),
    CEO: z.string().optional().default(""),
    broker_type: z.string().optional().default(""),
  }),
  
  regulation: z.object({
    is_regulated: z.boolean().default(false),
    licenses: z.array(licenseSchema).optional().default([]),
    regulatory_bodies: z.string().optional().default(""),
    investor_protection: z.string().optional().default(""),
    regulation_status: z.string().optional().default(""),
    offshore_regulation: z.boolean().default(false),
    risk_level: z.string().optional().default(""),
    regulated_in: z.array(z.string()).optional().default([]),
    regulator_name: z.array(z.string()).optional().default([]),
  }),
  
  tradingConditions: z.object({
    minimum_deposit: z.coerce.number().min(0).optional(),
    maximum_leverage: z.string().optional().default(""),
    spreads_from: z.coerce.number().min(0).optional(),
    commission: z.string().optional().default(""),
    account_types: z.string().optional().default(""),
    execution_type: z.string().optional().default(""),
    base_currency: z.string().optional().default(""),
    max_leverage: z.string().optional().default("1:500"),
    min_deposit: z.coerce.number().min(0).default(10),
    spread_type: z.string().optional().default(""),
    min_spread: z.coerce.number().min(0).optional().default(0),
    commission_per_lot: z.coerce.number().min(0).optional().default(0),
    execution_speed: z.string().optional().default(""),
  }),
  
  platforms: z.object({
    trading_platforms: z.string().optional().default(""),
    mobile_trading: z.boolean().default(false),
    demo_account: z.boolean().default(false),
    copy_trading: z.boolean().default(false),
    platforms_supported: z.array(z.string()).optional().default([]),
    mt4_license_type: z.enum(['Full License', 'White Label', 'None']).default('None'),
    mt5_license_type: z.enum(['Full License', 'White Label', 'None']).default('None'),
    custom_platform: z.boolean().optional().default(false),
  }),
  
  instruments: z.object({
    forex_pairs: z.string().optional().default(""),
    crypto_trading: z.boolean().default(false),
    stocks: z.boolean().default(false),
    commodities: z.boolean().default(false),
    indices: z.boolean().default(false),
  }),
  
  depositsWithdrawals: z.object({
    payment_methods: z.array(z.string()).optional().default([]),
    min_withdrawal: z.coerce.number().min(0).optional().default(0),
    withdrawal_speed: z.string().optional().default(""),
    deposit_fees: z.boolean().default(false),
    withdrawal_fees: z.boolean().default(false),
  }),
  
  cashback: z.object({
    offers_cashback: z.boolean().default(false),
    cashback_amount: z.coerce.number().min(0).optional(),
    cashback_currency: z.string().optional().default(""),
    cashback_frequency: z.enum(['Daily', 'Weekly', 'Monthly']).default('Daily'),
    minimum_withdrawal: z.coerce.number().min(0).optional(),
    eligible_instruments: z.string().optional().default(""),
    terms_and_conditions: z.string().optional().default(""),
    affiliate_program_link: z.string().url("يجب أن يكون رابطًا صالحًا.").or(z.literal("")).optional().default(""),
    cashback_account_type: z.array(z.string()).optional().default([]),
    rebate_method: z.array(z.string()).optional().default([]),
    cashback_per_lot: z.coerce.number().min(0).optional().default(0),
  }),
  
  globalReach: z.object({
    business_region: z.array(z.string()).optional().default([]),
    global_presence: z.string().optional().default(""),
    languages_supported: z.array(z.string()).optional().default([]),
    customer_support_channels: z.array(z.string()).optional().default([]),
  }),
  
  reputation: z.object({
    wikifx_score: z.coerce.number().min(0).max(10).optional().default(0),
    trustpilot_rating: z.coerce.number().min(0).max(5).optional().default(0),
    reviews_count: z.coerce.number().min(0).optional().default(0),
    verified_users: z.coerce.number().min(0).optional().default(0),
  }),
  
  additionalFeatures: z.object({
    swap_free: z.boolean().default(false),
    education_center: z.boolean().default(false),
    copy_trading: z.boolean().default(false),
    demo_account: z.boolean().default(false),
    trading_contests: z.boolean().default(false),
    regulatory_alerts: z.string().optional().default(""),
    welcome_bonus: z.boolean().default(false),
  }),
  
  instructions: z.object({
    description: z.string().optional().default(""),
    new_account_instructions: z.string().optional().default(""),
    new_account_link: z.string().url("يجب أن يكون رابطًا صالحًا.").or(z.literal("")).optional().default(""),
    new_account_link_text: z.string().optional().default(""),
  }),
  
  existingAccountInstructions: z.object({
    description: z.string().optional().default(""),
    linkText: z.string().optional().default(""),
    link: z.string().url().or(z.literal("")).optional().default(""),
  }).optional().default({ description: "", linkText: "", link: "" }),
});

type BrokerFormValues = z.infer<typeof formSchema>;

const getSafeDefaultValues = (broker?: Broker | null): BrokerFormValues => {
  const defaults: BrokerFormValues = {
    logoUrl: "https://placehold.co/100x100.png",
    category: 'forex',
    description: "",
    basicInfo: { broker_name: "", year_founded: undefined, headquarters: "", website: "", company_name: "", group_entity: "", founded_year: new Date().getFullYear(), CEO: "", broker_type: "" },
    regulation: { is_regulated: false, licenses: [], regulatory_bodies: "", investor_protection: "", regulation_status: "", offshore_regulation: false, risk_level: "", regulated_in: [], regulator_name: [] },
    tradingConditions: { minimum_deposit: undefined, maximum_leverage: "", spreads_from: undefined, commission: "", account_types: "", execution_type: "", base_currency: "", max_leverage: "1:500", min_deposit: 10, spread_type: "", min_spread: 0, commission_per_lot: 0, execution_speed: "" },
    platforms: { trading_platforms: "", mobile_trading: false, demo_account: false, copy_trading: false, platforms_supported: [], mt4_license_type: 'None', mt5_license_type: 'None', custom_platform: false },
    instruments: { forex_pairs: "", crypto_trading: false, stocks: false, commodities: false, indices: false },
    depositsWithdrawals: { payment_methods: [], min_withdrawal: 0, withdrawal_speed: "", deposit_fees: false, withdrawal_fees: false },
    cashback: { offers_cashback: false, cashback_amount: undefined, cashback_currency: "", cashback_frequency: "Daily", minimum_withdrawal: undefined, eligible_instruments: "", terms_and_conditions: "", affiliate_program_link: "", cashback_account_type: [], rebate_method: [], cashback_per_lot: 0 },
    globalReach: { business_region: [], global_presence: "", languages_supported: [], customer_support_channels: [] },
    reputation: { wikifx_score: 0, trustpilot_rating: 0, reviews_count: 0, verified_users: 0 },
    additionalFeatures: { swap_free: false, education_center: false, copy_trading: false, demo_account: false, trading_contests: false, regulatory_alerts: "", welcome_bonus: false },
    instructions: { description: "", new_account_instructions: "", new_account_link: "", new_account_link_text: "" },
    existingAccountInstructions: { description: "", linkText: "", link: "" },
  };

  if (!broker) return defaults;

  const brokerCopy = JSON.parse(JSON.stringify(broker));
  
  const merged = {
    ...defaults,
    ...brokerCopy,
    basicInfo: { ...defaults.basicInfo, ...brokerCopy.basicInfo },
    regulation: { ...defaults.regulation, ...brokerCopy.regulation },
    tradingConditions: { ...defaults.tradingConditions, ...brokerCopy.tradingConditions },
    platforms: { ...defaults.platforms, ...brokerCopy.platforms },
    instruments: { ...defaults.instruments, ...brokerCopy.instruments },
    depositsWithdrawals: { ...defaults.depositsWithdrawals, ...brokerCopy.depositsWithdrawals },
    cashback: { ...defaults.cashback, ...brokerCopy.cashback },
    globalReach: { ...defaults.globalReach, ...brokerCopy.globalReach },
    reputation: { ...defaults.reputation, ...brokerCopy.reputation },
    additionalFeatures: { ...defaults.additionalFeatures, ...brokerCopy.additionalFeatures },
    instructions: { ...defaults.instructions, ...brokerCopy.instructions },
    existingAccountInstructions: typeof brokerCopy.existingAccountInstructions === 'string'
      ? { description: brokerCopy.existingAccountInstructions, linkText: "", link: "" }
      : { ...defaults.existingAccountInstructions, ...brokerCopy.existingAccountInstructions },
  };

  return merged;
};

const wizardSteps: WizardStep[] = [
  {
    id: "basic",
    label: "Basic Information",
    labelAr: "معلومات أساسية",
    description: "Enter the broker's basic details and company information",
    descriptionAr: "أدخل التفاصيل الأساسية ومعلومات الشركة للوسيط",
    component: BasicInfoStep,
  },
  {
    id: "regulation",
    label: "Regulation & Licensing",
    labelAr: "التنظيم والترخيص",
    description: "Add regulatory information and licenses",
    descriptionAr: "أضف معلومات التنظيم والتراخيص",
    component: RegulationStep,
  },
  {
    id: "trading",
    label: "Trading Conditions",
    labelAr: "شروط التداول",
    description: "Configure spreads, leverage, and account types",
    descriptionAr: "قم بتكوين الفروقات والرافعة المالية وأنواع الحسابات",
    component: TradingConditionsStep,
  },
  {
    id: "platforms",
    label: "Platforms & Tools",
    labelAr: "المنصات والأدوات",
    description: "Select available trading platforms and features",
    descriptionAr: "حدد منصات التداول والميزات المتاحة",
    component: PlatformsStep,
  },
  {
    id: "instruments",
    label: "Trading Instruments",
    labelAr: "أدوات التداول",
    description: "Configure available trading instruments and asset classes",
    descriptionAr: "قم بتكوين أدوات التداول وفئات الأصول المتاحة",
    component: InstrumentsStep,
  },
  {
    id: "deposits",
    label: "Deposits & Withdrawals",
    labelAr: "الإيداعات والسحوبات",
    description: "Set up payment methods and withdrawal policies",
    descriptionAr: "قم بإعداد طرق الدفع وسياسات السحب",
    component: DepositsWithdrawalsStep,
  },
  {
    id: "cashback",
    label: "Cashback & Rewards",
    labelAr: "الكاش باك والمكافآت",
    description: "Set up cashback programs and reward terms",
    descriptionAr: "قم بإعداد برامج الكاش باك وشروط المكافآت",
    component: CashbackStep,
  },
  {
    id: "global",
    label: "Global Reach",
    labelAr: "التواجد العالمي",
    description: "Configure global presence and language support",
    descriptionAr: "قم بتكوين التواجد العالمي ودعم اللغات",
    component: GlobalReachStep,
  },
  {
    id: "reputation",
    label: "Reputation & Reviews",
    labelAr: "السمعة والتقييمات",
    description: "Add reputation scores and user reviews",
    descriptionAr: "أضف درجات السمعة وتقييمات المستخدمين",
    component: ReputationStep,
  },
  {
    id: "features",
    label: "Additional Features",
    labelAr: "ميزات إضافية",
    description: "Configure bonus features and special offerings",
    descriptionAr: "قم بتكوين الميزات الإضافية والعروض الخاصة",
    component: AdditionalFeaturesStep,
  },
  {
    id: "instructions",
    label: "Instructions & Links",
    labelAr: "التعليمات والروابط",
    description: "Add account setup instructions and links",
    descriptionAr: "أضف تعليمات إعداد الحساب والروابط",
    component: InstructionsStep,
  },
];

export default function BrokerFormPage() {
  const router = useRouter();
  const params = useParams();
  const brokerId = params.brokerId as string;
  const isNew = brokerId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getSafeDefaultValues(null),
  });

  useEffect(() => {
    if (!isNew) {
      const fetchBroker = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('brokers')
          .select('*')
          .eq('id', brokerId)
          .single();
        
        if (error || !data) {
          notFound();
        } else {
          const broker = transformBrokerFromDB(data);
          form.reset(getSafeDefaultValues(broker));
        }
        setIsLoading(false);
      };
      fetchBroker();
    }
  }, [brokerId, isNew, form]);

  const handleAutosave = async (data: BrokerFormValues) => {
    if (!isNew) {
      try {
        const key = `broker_draft_${brokerId}`;
        localStorage.setItem(key, JSON.stringify({
          data,
          savedAt: new Date().toISOString(),
        }));
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    }
  };

  useAutosave({
    form,
    onSave: handleAutosave,
    enabled: !isNew && !isLoading,
    debounceMs: 3000,
  });

  const handleSubmit = async (values: BrokerFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = transformFormToBroker(values);

      let result;
      if (isNew) {
        result = await addBroker(payload as Omit<Broker, 'id' | 'order'>);
      } else {
        result = await updateBroker(brokerId, payload);
      }
      
      if (result.success) {
        toast({
          title: isNew ? "Broker added successfully" : "Broker updated successfully",
          description: isNew ? "تمت إضافة الوسيط بنجاح" : "تم تحديث الوسيط بنجاح",
        });
        
        if (!isNew) {
          const key = `broker_draft_${brokerId}`;
          localStorage.removeItem(key);
        }
        
        router.push('/admin/manage-brokers');
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving broker:", error);
      toast({
        title: "Error",
        description: "Failed to save broker",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (data: BrokerFormValues) => {
    toast({
      title: "Draft saved",
      description: "Your changes have been saved as a draft",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/manage-brokers')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          <span className="ltr:inline hidden">Back to Brokers</span>
          <span className="rtl:inline hidden">العودة إلى الوسطاء</span>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">
          <span className="ltr:inline hidden">
            {isNew ? "Add New Broker" : "Edit Broker"}
          </span>
          <span className="rtl:inline hidden">
            {isNew ? "إضافة وسيط جديد" : "تعديل وسيط"}
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">
          <span className="ltr:inline hidden">
            {isNew
              ? "Fill in the details below to add a new broker to the platform"
              : "Update the broker information using the form below"}
          </span>
          <span className="rtl:inline hidden">
            {isNew
              ? "املأ التفاصيل أدناه لإضافة وسيط جديد إلى المنصة"
              : "قم بتحديث معلومات الوسيط باستخدام النموذج أدناه"}
          </span>
        </p>
      </div>

      <Form {...form}>
        <BrokerFormWizard
          steps={wizardSteps}
          form={form}
          onSubmit={handleSubmit}
          onSaveDraft={!isNew ? handleSaveDraft : undefined}
          isSubmitting={isSubmitting}
          isNew={isNew}
        />
      </Form>
    </div>
  );
}
