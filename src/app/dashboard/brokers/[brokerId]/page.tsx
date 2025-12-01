
"use client";

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import type { Broker } from '@/types';
import {
    ArrowLeft, ShieldCheck, Globe, Star, Users, Award, Briefcase, CheckCircle, XCircle, Gauge, Scale,
    Landmark, Coins, BrainCircuit, Copy, TestTube2, AlertTriangle, UserPlus, FileText, Link2, ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { TermsBank } from '@/lib/terms-bank';

// Transform database format to TypeScript types (snake_case to camelCase)
function transformBrokerFromDB(dbBroker: any): Broker {
  return {
    id: dbBroker.id,
    order: dbBroker.order,
    logoUrl: dbBroker.logo_url || dbBroker.logoUrl || "https://placehold.co/100x100.png",
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
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    )
}

function DetailCard({ title, icon: Icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
                <Icon className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-headline">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm space-y-2">
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
        <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">{label}</span>
            <div className="font-medium text-right">
                {children || value}
            </div>
        </div>
    )
}

function BooleanPill({ value, text }: { value: boolean | undefined, text: string }) {
    if (value === undefined) return null;
    return (
        <div className="flex items-center gap-1.5">
            {value ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
            <span className="text-xs">{text}</span>
        </div>
    )
}

function findLabel(bank: {key: string, label: string}[], key: string | undefined) {
    if (!key) return key;
    return bank.find(item => item.key === key)?.label || key;
}

// Ensure a value is an array, handling various data types from database
function ensureArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value] as T[];
    if (value && typeof value === 'object') return [value] as T[];
    return [];
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
            <div className="container mx-auto px-4 py-4 max-w-2xl">
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
        instructions = {},
        logoUrl = "https://placehold.co/100x100.png"
    } = broker || {};
    
    return (
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
            <Button variant="ghost" asChild className="h-auto p-0 text-sm">
                <Link href="/dashboard/brokers"><ArrowLeft className="mr-2 h-4 w-4" />العودة إلى الوسطاء</Link>
            </Button>
            
            <Card className="overflow-hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <Image
                        src={logoUrl || "https://placehold.co/100x100.png"}
                        alt={`${basicInfo?.broker_name || 'Broker'} logo`}
                        width={64}
                        height={64}
                        className="w-16 h-16 object-contain rounded-lg border p-1 bg-white flex-shrink-0"
                        data-ai-hint="logo"
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/100x100.png"; }}
                    />
                    <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-2xl font-bold font-headline">{basicInfo?.broker_name || broker?.name || 'Unknown Broker'}</h1>
                        <p className="text-sm text-muted-foreground">{basicInfo?.group_entity || ""}</p>
                    </div>
                    <Button asChild size="sm">
                        <Link href={`/dashboard/brokers/${brokerId}/link`}>ابدأ في كسب الكاش باك</Link>
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                 <Badge variant="outline" className="flex-col h-14 justify-center gap-1"><Star className="h-4 w-4 text-yellow-500"/> <span className="font-bold">{reputation?.wikifx_score?.toFixed(1) || '0'}</span><span className="text-xs">تقييم WikiFX</span></Badge>
                 <Badge variant="outline" className="flex-col h-14 justify-center gap-1"><Users className="h-4 w-4 text-primary"/> <span className="font-bold">{reputation?.verified_users?.toLocaleString() || '0'}</span><span className="text-xs">مستخدمون موثوقون</span></Badge>
                 <Badge variant="outline" className="flex-col h-14 justify-center gap-1 capitalize"><ShieldCheck className="h-4 w-4 text-blue-500"/> <span className="font-bold">{regulation?.risk_level || 'N/A'}</span><span className="text-xs">مستوى المخاطرة</span></Badge>
                 <Badge variant="outline" className="flex-col h-14 justify-center gap-1"><Award className="h-4 w-4 text-green-500"/> <span className="font-bold">{basicInfo?.founded_year || 'N/A'}</span><span className="text-xs">تأسست</span></Badge>
            </div>
            
            <DetailCard title="المعلومات الأساسية" icon={Briefcase}>
                <InfoRow label="المؤسس / CEO" value={basicInfo.CEO} />
                <InfoRow label="المقر الرئيسي" value={basicInfo.headquarters} />
                <InfoRow label="نوع الشركة" value={findLabel(TermsBank.brokerType, basicInfo.broker_type)} />
                <InfoRow label="الحالة التنظيمية" value={findLabel(TermsBank.regulationStatus, regulation.regulation_status)} />
            </DetailCard>
            
            <DetailCard title="التراخيص" icon={ShieldCheck}>
                {ensureArray(regulation.licenses).map((license, index) => (
                    <React.Fragment key={index}>
                        <div className="p-2 bg-muted/50 rounded-md">
                            <InfoRow label="جهة الترخيص" value={findLabel(TermsBank.licenseAuthority, license.authority)} />
                            <InfoRow label="رقم الترخيص" value={license.licenseNumber} />
                            <InfoRow label="حالة الترخيص" value={findLabel(TermsBank.regulationStatus, license.status)} />
                        </div>
                        {index < ensureArray(regulation.licenses).length - 1 && <Separator className="my-2" />}
                    </React.Fragment>
                 ))}
            </DetailCard>

             <DetailCard title="منصات التداول" icon={Gauge}>
                <InfoRow label="المنصات المدعومة">
                    <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(platforms.platforms_supported).map(p => <Badge key={p} variant="secondary">{findLabel(TermsBank.platforms, p)}</Badge>)}
                    </div>
                </InfoRow>
                <Separator className="my-2" />
                <InfoRow label="ترخيص MT4" value={platforms.mt4_license_type} />
                <InfoRow label="ترخيص MT5" value={platforms.mt5_license_type} />
            </DetailCard>
            
            <DetailCard title="الحسابات وأنواعها" icon={Users}>
                <InfoRow label="أنواع الحسابات">
                     <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(tradingConditions.account_types).map(t => <Badge key={t} variant="secondary">{findLabel(TermsBank.accountTypes, t)}</Badge>)}
                    </div>
                </InfoRow>
                <Separator className="my-2" />
                <InfoRow label="الحد الأدنى للإيداع" value={`$${tradingConditions.min_deposit}`} />
                <InfoRow label="الرافعة المالية القصوى" value={tradingConditions.max_leverage} />
                <InfoRow label="نوع السبريد" value={findLabel(TermsBank.spreadType, tradingConditions.spread_type)} />
                <InfoRow label="أدنى سبريد (نقاط)" value={tradingConditions.min_spread} />
            </DetailCard>

            <DetailCard title="ميزات الحساب" icon={Award}>
                 <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                    <BooleanPill value={additionalFeatures.welcome_bonus} text="بونص ترحيبي ومكافآت" />
                    <BooleanPill value={additionalFeatures.copy_trading} text="نسخ التداول" />
                    <BooleanPill value={instruments.crypto_trading} text="تداول العملات المشفرة" />
                    <BooleanPill value={additionalFeatures.swap_free} text="حسابات إسلامية" />
                    <BooleanPill value={additionalFeatures.demo_account} text="حسابات تجريبية" />
                    <BooleanPill value={additionalFeatures.education_center} text="مركز تعليمي" />
                    <BooleanPill value={additionalFeatures.trading_contests} text="مسابقات تداول" />
                </div>
            </DetailCard>
            
            <DetailCard title="المنتجات المالية" icon={BrainCircuit}>
                 <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                    <BooleanPill value={!!instruments.forex_pairs} text="فوركس" />
                    <BooleanPill value={instruments.stocks} text="أسهم" />
                    <BooleanPill value={instruments.commodities} text="سلع" />
                    <BooleanPill value={instruments.indices} text="مؤشرات" />
                 </div>
            </DetailCard>
            
            <DetailCard title="طرق الدفع والسحب" icon={Landmark}>
                <InfoRow label="طرق الدفع">
                     <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(depositsWithdrawals.payment_methods).map(p => <Badge key={p} variant="secondary">{findLabel(TermsBank.depositMethods, p)}</Badge>)}
                    </div>
                </InfoRow>
                <Separator className="my-2" />
                 <InfoRow label="الحد الأدنى للسحب" value={`$${depositsWithdrawals.min_withdrawal}`} />
                 <InfoRow label="سرعة السحب" value={findLabel(TermsBank.supportHours, depositsWithdrawals.withdrawal_speed)} />
                 <Separator className="my-2" />
                 <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                     <BooleanPill value={depositsWithdrawals.deposit_fees} text="رسوم على الإيداع" />
                     <BooleanPill value={depositsWithdrawals.withdrawal_fees} text="رسوم على السحب" />
                 </div>
            </DetailCard>
            
            <DetailCard title="الدعم والخدمة" icon={Globe}>
                <InfoRow label="اللغات المدعومة">
                    <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(globalReach.languages_supported).map(l => <Badge key={l} variant="secondary">{findLabel(TermsBank.languagesSupported, l)}</Badge>)}
                    </div>
                </InfoRow>
                 <Separator className="my-2" />
                 <InfoRow label="قنوات الدعم">
                    <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(globalReach.customer_support_channels).map(c => <Badge key={c} variant="secondary">{findLabel(TermsBank.supportChannels, c)}</Badge>)}
                    </div>
                </InfoRow>
                 <Separator className="my-2" />
                 <InfoRow label="ساعات الدعم" value={findLabel(TermsBank.supportHours, globalReach.global_presence)} />
            </DetailCard>
            
            <DetailCard title="برامج المكافآت" icon={Coins}>
                 <InfoRow label="أنواع الحسابات المؤهلة">
                    <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(cashback.cashback_account_type).map(a => <Badge key={a} variant="secondary">{findLabel(TermsBank.accountTypes, a)}</Badge>)}
                    </div>
                </InfoRow>
                 <Separator className="my-2" />
                 <InfoRow label="تكرار المكافأة" value={findLabel(TermsBank.cashbackFrequency, cashback.cashback_frequency)} />
                 <InfoRow label="طريقة دفع المكافأة">
                     <div className="flex gap-1 flex-wrap justify-end">
                       {ensureArray(cashback.rebate_method).map(m => <Badge key={m} variant="secondary">{findLabel(TermsBank.rebateMethod, m)}</Badge>)}
                    </div>
                </InfoRow>
                 <InfoRow label="قيمة المكافأة لكل لوت" value={`$${cashback.cashback_per_lot}`} />
            </DetailCard>

            <DetailCard title="تقييمات الوسيط" icon={Star}>
                 <InfoRow label="تقييم Trustpilot" value={reputation.trustpilot_rating} />
                 <InfoRow label="عدد المراجعات" value={reputation.reviews_count?.toLocaleString()} />
            </DetailCard>
            
            <DetailCard title="تعليمات" icon={FileText}>
                 <p className="text-xs text-muted-foreground whitespace-pre-wrap">{instructions?.description}</p>
            </DetailCard>
             
        </div>
    )
}
