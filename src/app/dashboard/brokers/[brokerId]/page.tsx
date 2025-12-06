
"use client";

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { Broker } from '@/types';
import {
    ArrowRight, Shield, Star, CheckCircle, XCircle, TrendingUp,
    Banknote, CreditCard, Clock, Building2, Globe, Headphones
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import React from 'react';
import { TermsBank } from '@/lib/terms-bank';

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

function BrokerDetailSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    )
}

function ensureArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value] as T[];
    if (value && typeof value === 'object') return [value] as T[];
    return [];
}

function findLabel(bank: {key: string, label: string}[], key: string | undefined) {
    if (!key) return key;
    return bank.find(item => item.key === key)?.label || key;
}

function FeatureBadge({ active, label }: { active: boolean | undefined, label: string }) {
    if (!active) return null;
    return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3" />
            {label}
        </span>
    );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | undefined }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

export default function BrokerPreviewPage() {
    const params = useParams();
    const brokerId = params.brokerId as string;

    const [broker, setBroker] = useState<Broker | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBroker = async () => {
            if (!brokerId) return;
            setIsLoading(true);
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
                setIsLoading(false);
            }
        };
        fetchBroker();
    }, [brokerId]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-4 max-w-lg">
                <BrokerDetailSkeleton />
            </div>
        )
    }

    if (!broker) {
        notFound();
    }
    
    const { 
        basicInfo = {}, 
        regulation = {}, 
        tradingConditions = {}, 
        platforms = {}, 
        instruments = {}, 
        depositsWithdrawals = {}, 
        cashback = {}, 
        globalReach = {}, 
        reputation = {}, 
        additionalFeatures = {}, 
        description = "",
        logoUrl = ""
    } = broker || {};

    const name = broker.name || basicInfo.broker_name || 'Unknown Broker';
    const rating = (reputation?.wikifx_score ?? 0) / 2;
    const isRegulated = regulation?.regulation_status?.toLowerCase().includes('regulated') || (regulation?.licenses?.length ?? 0) > 0;
    const platformsList = ensureArray<string>(platforms.platforms_supported);
    const paymentMethods = ensureArray<string>(depositsWithdrawals.payment_methods);
    const licenses = ensureArray<any>(regulation.licenses);
    
    return (
        <div className="container mx-auto px-4 py-4 max-w-lg space-y-4">
            <Button variant="ghost" asChild className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/brokers" className="flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" />
                    العودة
                </Link>
            </Button>
            
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            {logoUrl ? (
                                <div className="w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={logoUrl}
                                        alt={`${name} logo`}
                                        width={56}
                                        height={56}
                                        className="w-14 h-14 object-contain"
                                        data-ai-hint="company logo"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-xl border bg-muted flex items-center justify-center">
                                    <span className="text-2xl font-bold text-muted-foreground">{name.charAt(0)}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold truncate">{name}</h1>
                                {isRegulated && <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                                ))}
                                <span className="text-xs text-muted-foreground mr-1">({rating.toFixed(1)})</span>
                            </div>
                            {basicInfo.founded_year && (
                                <p className="text-xs text-muted-foreground">تأسس عام {basicInfo.founded_year}</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">كاش باك لكل لوت</span>
                            <Badge variant="secondary" className="text-[10px]">
                                {cashback.cashback_frequency === 'Daily' ? 'يومي' : cashback.cashback_frequency === 'Weekly' ? 'أسبوعي' : 'شهري'}
                            </Badge>
                        </div>
                        <p className="text-3xl font-bold text-primary">${cashback.cashback_per_lot || 0}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button asChild className="w-full">
                            <Link href={`/dashboard/brokers/${brokerId}/link?action=new`}>
                                <TrendingUp className="h-4 w-4 ml-1.5" />
                                فتح حساب جديد
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={`/dashboard/brokers/${brokerId}/link?action=existing`}>
                                ربط حساب موجود
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {description && (
                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-wrap gap-1.5">
                <FeatureBadge active={tradingConditions.swap_free || additionalFeatures.swap_free} label="حساب إسلامي" />
                <FeatureBadge active={additionalFeatures.copy_trading} label="نسخ التداول" />
                <FeatureBadge active={additionalFeatures.demo_account} label="حساب تجريبي" />
                <FeatureBadge active={additionalFeatures.education_center} label="مركز تعليمي" />
                <FeatureBadge active={additionalFeatures.welcome_bonus} label="مكافأة ترحيبية" />
                <FeatureBadge active={additionalFeatures.trading_contests} label="مسابقات" />
            </div>

            <Card>
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3">معلومات سريعة</h3>
                    <div className="grid grid-cols-2 gap-x-4">
                        <InfoItem icon={Banknote} label="الحد الأدنى للإيداع" value={`$${tradingConditions.min_deposit || 0}`} />
                        <InfoItem icon={TrendingUp} label="الرافعة المالية" value={tradingConditions.max_leverage} />
                        <InfoItem icon={Clock} label="سرعة السحب" value={findLabel(TermsBank.supportHours, depositsWithdrawals.withdrawal_speed)} />
                        <InfoItem icon={Building2} label="المقر الرئيسي" value={basicInfo.headquarters} />
                    </div>
                </CardContent>
            </Card>

            {platformsList.length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold mb-3">منصات التداول</h3>
                        <div className="flex flex-wrap gap-2">
                            {platformsList.map((platform, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {findLabel(TermsBank.platforms, platform)}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value="trading" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium py-3">شروط التداول</AccordionTrigger>
                    <AccordionContent className="pb-4">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">نوع السبريد</span>
                                <span className="font-medium">{findLabel(TermsBank.spreadType, tradingConditions.spread_type) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">أدنى سبريد</span>
                                <span className="font-medium">{tradingConditions.min_spread ?? 'N/A'} نقطة</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-dashed">
                                <span className="text-muted-foreground">العمولة لكل لوت</span>
                                <span className="font-medium">${tradingConditions.commission_per_lot ?? 0}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">سرعة التنفيذ</span>
                                <span className="font-medium">{tradingConditions.execution_speed || 'N/A'}</span>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="instruments" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium py-3">الأدوات المالية</AccordionTrigger>
                    <AccordionContent className="pb-4">
                        <div className="flex flex-wrap gap-2">
                            {instruments.forex_pairs && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                                    <CheckCircle className="h-3 w-3 text-green-600" /> فوركس
                                </span>
                            )}
                            {instruments.stocks && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                                    <CheckCircle className="h-3 w-3 text-green-600" /> أسهم
                                </span>
                            )}
                            {instruments.commodities && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                                    <CheckCircle className="h-3 w-3 text-green-600" /> سلع
                                </span>
                            )}
                            {instruments.indices && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                                    <CheckCircle className="h-3 w-3 text-green-600" /> مؤشرات
                                </span>
                            )}
                            {instruments.crypto_trading && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted">
                                    <CheckCircle className="h-3 w-3 text-green-600" /> عملات رقمية
                                </span>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {paymentMethods.length > 0 && (
                    <AccordionItem value="payment" className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-medium py-3">طرق الدفع</AccordionTrigger>
                        <AccordionContent className="pb-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {paymentMethods.map((method, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {findLabel(TermsBank.depositMethods, method)}
                                    </Badge>
                                ))}
                            </div>
                            <div className="space-y-2 text-sm border-t pt-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">رسوم الإيداع</span>
                                    <span className={depositsWithdrawals.deposit_fees ? 'text-red-600' : 'text-green-600'}>
                                        {depositsWithdrawals.deposit_fees ? 'نعم' : 'مجاني'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">رسوم السحب</span>
                                    <span className={depositsWithdrawals.withdrawal_fees ? 'text-red-600' : 'text-green-600'}>
                                        {depositsWithdrawals.withdrawal_fees ? 'نعم' : 'مجاني'}
                                    </span>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {licenses.length > 0 && (
                    <AccordionItem value="licenses" className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-medium py-3">التراخيص والتنظيم</AccordionTrigger>
                        <AccordionContent className="pb-4">
                            <div className="space-y-3">
                                {licenses.map((license, index) => (
                                    <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{findLabel(TermsBank.licenseAuthority, license.authority)}</span>
                                        </div>
                                        {license.licenseNumber && (
                                            <p className="text-xs text-muted-foreground">رقم الترخيص: {license.licenseNumber}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                <AccordionItem value="support" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-medium py-3">الدعم والخدمة</AccordionTrigger>
                    <AccordionContent className="pb-4">
                        <div className="space-y-3">
                            {ensureArray(globalReach.languages_supported).length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> اللغات المدعومة
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {ensureArray<string>(globalReach.languages_supported).map((lang, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px]">
                                                {findLabel(TermsBank.languagesSupported, lang)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {ensureArray(globalReach.customer_support_channels).length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                        <Headphones className="h-3 w-3" /> قنوات الدعم
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {ensureArray<string>(globalReach.customer_support_channels).map((channel, i) => (
                                            <Badge key={i} variant="outline" className="text-[10px]">
                                                {findLabel(TermsBank.supportChannels, channel)}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="pb-4">
                <Button asChild className="w-full" size="lg">
                    <Link href={`/dashboard/brokers/${brokerId}/link`}>
                        ابدأ في كسب الكاش باك
                    </Link>
                </Button>
            </div>
        </div>
    )
}
