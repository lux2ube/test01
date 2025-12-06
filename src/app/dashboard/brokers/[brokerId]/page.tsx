
"use client";

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import type { Broker } from '@/types';
import {
    ArrowRight, Shield, Star, CheckCircle, XCircle, TrendingUp,
    Briefcase, Gauge, Award, Landmark, Globe, Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

function DetailCard({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex rtl:flex-row-reverse flex-row items-center gap-3 space-y-0 p-4 pb-2">
                <Icon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-sm space-y-2">
                {children}
            </CardContent>
        </Card>
    )
}

function InfoRow({ label, value, children }: { label: string, value?: any, children?: React.ReactNode }) {
    if (value === undefined && !children) return null;
    if (Array.isArray(value) && value.length === 0) return null;
    if (value === '' || value === null) return null;

    return (
        <div className="flex rtl:flex-row-reverse justify-between items-center py-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="font-medium text-xs rtl:text-left text-right">
                {children || value}
            </div>
        </div>
    )
}

function BooleanPill({ value, text }: { value: boolean | undefined, text: string }) {
    if (value === undefined) return null;
    return (
        <div className="flex items-center gap-1.5">
            {value ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
            <span className="text-xs">{text}</span>
        </div>
    )
}

export default function BrokerPreviewPage() {
    const params = useParams();
    const brokerId = params.brokerId as string;

    const [broker, setBroker] = useState<Broker | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("trading");

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
            <div className="container mx-auto px-4 py-4 max-w-xl">
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
        logoUrl = ""
    } = broker || {};

    const name = broker.name || basicInfo.broker_name || 'Unknown Broker';
    const rating = reputation?.wikifx_score ?? 0;
    const isRegulated = regulation?.regulation_status?.toLowerCase().includes('regulated') || (regulation?.licenses?.length ?? 0) > 0;
    const hasSwapFree = tradingConditions.swap_free || additionalFeatures.swap_free;
    
    return (
        <div className="container mx-auto px-4 py-4 max-w-xl space-y-4">
            <Button variant="ghost" asChild className="h-auto p-0 text-sm text-muted-foreground hover:text-foreground">
                <Link href="/dashboard/brokers" className="flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" />
                    العودة
                </Link>
            </Button>
            
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                        {logoUrl ? (
                            <div className="w-14 h-14 rounded-lg border bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                    src={logoUrl}
                                    alt={`${name} logo`}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-lg border bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-xl font-bold text-muted-foreground">{name.charAt(0)}</span>
                            </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold truncate">{name}</h1>
                                {isRegulated && <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                    <span>{rating.toFixed(1)}</span>
                                </div>
                                {basicInfo.founded_year && (
                                    <>
                                        <span>•</span>
                                        <span>منذ {basicInfo.founded_year}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-primary/5 rounded-lg">
                            <p className="text-lg font-bold text-primary">${cashback.cashback_amount || cashback.cashback_per_lot || 0}</p>
                            <p className="text-[10px] text-muted-foreground">كاش باك/لوت</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded-lg">
                            <p className="text-lg font-bold">${tradingConditions.min_deposit || 0}</p>
                            <p className="text-[10px] text-muted-foreground">الحد الأدنى للإيداع</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded-lg">
                            <p className="text-lg font-bold">{tradingConditions.max_leverage || 'N/A'}</p>
                            <p className="text-[10px] text-muted-foreground">الرافعة</p>
                        </div>
                    </div>

                    <Button asChild className="w-full">
                        <Link href={`/dashboard/brokers/${brokerId}/link`}>
                            <TrendingUp className="h-4 w-4 ml-2" />
                            ابدأ في كسب الكاش باك
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9">
                    <TabsTrigger value="trading" className="text-xs">التداول</TabsTrigger>
                    <TabsTrigger value="payment" className="text-xs">الدفع</TabsTrigger>
                    <TabsTrigger value="features" className="text-xs">المميزات</TabsTrigger>
                    <TabsTrigger value="info" className="text-xs">معلومات</TabsTrigger>
                </TabsList>

                <TabsContent value="trading" className="space-y-3 mt-3">
                    <DetailCard title="منصات التداول" icon={Gauge}>
                        <div className="flex gap-1 flex-wrap">
                            {ensureArray<string>(platforms.platforms_supported).map(p => (
                                <Badge key={p} variant="outline" className="text-xs">{findLabel(TermsBank.platforms, p)}</Badge>
                            ))}
                        </div>
                        <Separator className="my-2" />
                        <InfoRow label="نوع السبريد" value={findLabel(TermsBank.spreadType, tradingConditions.spread_type)} />
                        <InfoRow label="أدنى سبريد" value={tradingConditions.min_spread ? `${tradingConditions.min_spread} نقطة` : undefined} />
                    </DetailCard>

                    <DetailCard title="أنواع الحسابات" icon={Users}>
                        <div className="flex gap-1 flex-wrap">
                            {ensureArray<string>(tradingConditions.account_types).map(t => (
                                <Badge key={t} variant="outline" className="text-xs">{findLabel(TermsBank.accountTypes, t)}</Badge>
                            ))}
                        </div>
                    </DetailCard>

                    <DetailCard title="الأدوات المالية" icon={TrendingUp}>
                        <div className="grid grid-cols-2 gap-2">
                            <BooleanPill value={!!instruments.forex_pairs} text="فوركس" />
                            <BooleanPill value={instruments.stocks} text="أسهم" />
                            <BooleanPill value={instruments.commodities} text="سلع" />
                            <BooleanPill value={instruments.indices} text="مؤشرات" />
                            <BooleanPill value={instruments.crypto_trading} text="عملات رقمية" />
                        </div>
                    </DetailCard>
                </TabsContent>

                <TabsContent value="payment" className="space-y-3 mt-3">
                    <DetailCard title="طرق الدفع" icon={Landmark}>
                        <div className="flex gap-1 flex-wrap mb-2">
                            {ensureArray<string>(depositsWithdrawals.payment_methods).map(p => (
                                <Badge key={p} variant="outline" className="text-xs">{findLabel(TermsBank.depositMethods, p)}</Badge>
                            ))}
                        </div>
                        <Separator className="my-2" />
                        <InfoRow label="الحد الأدنى للإيداع" value={`$${depositsWithdrawals.min_deposit || tradingConditions.min_deposit || 0}`} />
                        <InfoRow label="الحد الأدنى للسحب" value={depositsWithdrawals.min_withdrawal ? `$${depositsWithdrawals.min_withdrawal}` : undefined} />
                        <InfoRow label="سرعة السحب" value={findLabel(TermsBank.supportHours, depositsWithdrawals.withdrawal_speed)} />
                        <Separator className="my-2" />
                        <div className="grid grid-cols-2 gap-2">
                            <BooleanPill value={!depositsWithdrawals.deposit_fees} text="إيداع مجاني" />
                            <BooleanPill value={!depositsWithdrawals.withdrawal_fees} text="سحب مجاني" />
                        </div>
                    </DetailCard>
                </TabsContent>

                <TabsContent value="features" className="space-y-3 mt-3">
                    <DetailCard title="مميزات الحساب" icon={Award}>
                        <div className="grid grid-cols-2 gap-2">
                            <BooleanPill value={hasSwapFree} text="حسابات إسلامية" />
                            <BooleanPill value={additionalFeatures.copy_trading} text="نسخ التداول" />
                            <BooleanPill value={additionalFeatures.demo_account} text="حسابات تجريبية" />
                            <BooleanPill value={additionalFeatures.education_center} text="مركز تعليمي" />
                            <BooleanPill value={additionalFeatures.welcome_bonus} text="بونص ترحيبي" />
                            <BooleanPill value={additionalFeatures.trading_contests} text="مسابقات تداول" />
                        </div>
                    </DetailCard>

                    <DetailCard title="شروط التداول" icon={Gauge}>
                        <InfoRow label="أدنى سبريد" value={tradingConditions.min_spread ? `${tradingConditions.min_spread} نقطة` : undefined} />
                        <InfoRow label="الرافعة المالية القصوى" value={tradingConditions.max_leverage} />
                        <InfoRow label="العمولة لكل لوت" value={tradingConditions.commission_per_lot ? `$${tradingConditions.commission_per_lot}` : undefined} />
                    </DetailCard>
                </TabsContent>

                <TabsContent value="info" className="space-y-3 mt-3">
                    <DetailCard title="معلومات الشركة" icon={Briefcase}>
                        <InfoRow label="الاسم" value={basicInfo.broker_name} />
                        <InfoRow label="المؤسس / CEO" value={basicInfo.CEO} />
                        <InfoRow label="المقر الرئيسي" value={basicInfo.headquarters} />
                        <InfoRow label="سنة التأسيس" value={basicInfo.founded_year} />
                        <InfoRow label="نوع الشركة" value={findLabel(TermsBank.brokerType, basicInfo.broker_type)} />
                    </DetailCard>
                    
                    <DetailCard title="التراخيص" icon={Shield}>
                        {ensureArray<any>(regulation.licenses).map((license, index) => (
                            <div key={index} className="p-2 bg-muted/50 rounded-md mb-2 last:mb-0">
                                <InfoRow label="جهة الترخيص" value={findLabel(TermsBank.licenseAuthority, license.authority)} />
                                <InfoRow label="رقم الترخيص" value={license.licenseNumber} />
                            </div>
                        ))}
                        <InfoRow label="الحالة التنظيمية" value={findLabel(TermsBank.regulationStatus, regulation.regulation_status)} />
                    </DetailCard>

                    <DetailCard title="الدعم والخدمة" icon={Globe}>
                        <InfoRow label="اللغات المدعومة">
                            <div className="flex gap-1 flex-wrap justify-end">
                                {ensureArray<string>(globalReach.languages_supported).slice(0, 4).map(l => (
                                    <Badge key={l} variant="secondary" className="text-[10px]">{findLabel(TermsBank.languagesSupported, l)}</Badge>
                                ))}
                            </div>
                        </InfoRow>
                        <InfoRow label="قنوات الدعم">
                            <div className="flex gap-1 flex-wrap justify-end">
                                {ensureArray<string>(globalReach.customer_support_channels).slice(0, 3).map(c => (
                                    <Badge key={c} variant="secondary" className="text-[10px]">{findLabel(TermsBank.supportChannels, c)}</Badge>
                                ))}
                            </div>
                        </InfoRow>
                    </DetailCard>

                    <DetailCard title="التقييمات" icon={Star}>
                        <InfoRow label="تقييم WikiFX" value={reputation.wikifx_score?.toFixed(1)} />
                        <InfoRow label="تقييم Trustpilot" value={reputation.trustpilot_rating} />
                        <InfoRow label="عدد المراجعات" value={reputation.reviews_count?.toLocaleString()} />
                        <InfoRow label="المستخدمون الموثوقون" value={reputation.verified_users?.toLocaleString()} />
                    </DetailCard>
                </TabsContent>
            </Tabs>
        </div>
    )
}
