
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Broker } from "@/types";
import { Star, ChevronLeft, Banknote, Shield, TrendingUp } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
    const roundedRating = Math.round(rating * 2) / 2;
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => {
                 const starValue = index + 1;
                 let fillClass = 'text-gray-200';
                 if (roundedRating >= starValue) {
                     fillClass = 'text-amber-400 fill-amber-400';
                 }
                return (
                     <Star key={index} className={`h-3 w-3 ${fillClass}`} />
                );
            })}
            <span className="text-[10px] text-muted-foreground mr-1">({rating.toFixed(1)})</span>
        </div>
    )
}

const featureLabels: Record<string, string> = {
    swap_free: 'إسلامي',
    education_center: 'تعليم',
    copy_trading: 'نسخ',
    demo_account: 'تجريبي',
    trading_contests: 'مسابقات',
    welcome_bonus: 'مكافأة',
};

export function BrokerCard({ broker }: { broker: Broker }) {
  if (!broker) {
    return null; 
  }

  const name = broker.name || broker.basicInfo?.broker_name || 'Unknown Broker';
  const rating = (broker.reputation?.wikifx_score ?? 0) / 2;
  const cashbackPerLot = broker.cashback?.cashback_per_lot ?? 0;
  const cashbackFrequency = broker.cashback?.cashback_frequency || 'Monthly';
  const minDeposit = broker.tradingConditions?.min_deposit ?? 0;
  const regulationStatus = broker.regulation?.regulation_status || '';
  const isRegulated = regulationStatus.toLowerCase().includes('regulated') || (broker.regulation?.licenses?.length ?? 0) > 0;
  
  const platforms = broker.platforms?.platforms_supported || [];
  
  const activeFeatures: string[] = [];
  if (broker.tradingConditions?.swap_free) activeFeatures.push('swap_free');
  if (broker.additionalFeatures?.education_center) activeFeatures.push('education_center');
  if (broker.additionalFeatures?.copy_trading) activeFeatures.push('copy_trading');
  if (broker.additionalFeatures?.demo_account) activeFeatures.push('demo_account');
  if (broker.additionalFeatures?.trading_contests) activeFeatures.push('trading_contests');
  if (broker.additionalFeatures?.welcome_bonus) activeFeatures.push('welcome_bonus');
  
  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow duration-200 border-border/60">
        <CardContent className="p-0">
            <Link href={`/dashboard/brokers/${broker.id}`} className="block group">
                <div className="flex items-center gap-3 p-3 border-b border-border/40">
                    <div className="relative flex-shrink-0">
                        {broker.logoUrl ? (
                            <div className="w-14 h-14 rounded-xl border border-border/60 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                <Image
                                    src={broker.logoUrl}
                                    alt={`${name} logo`}
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 object-contain"
                                    data-ai-hint="company logo"
                                />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-xl border border-border/60 bg-muted flex items-center justify-center">
                                <span className="text-xl font-bold text-muted-foreground">
                                    {name.charAt(0)}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="text-base font-bold truncate">{name}</h3>
                            {isRegulated && (
                                <Shield className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                            )}
                        </div>
                        <StarRating rating={rating} />
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto scrollbar-hide">
                            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                ${minDeposit}
                            </span>
                            {platforms.slice(0, 2).map((platform, index) => (
                                <span 
                                    key={index} 
                                    className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                >
                                    {platform}
                                </span>
                            ))}
                            {activeFeatures.slice(0, 3).map((feature) => (
                                <span 
                                    key={feature} 
                                    className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                >
                                    {featureLabels[feature]}
                                </span>
                            ))}
                            {(platforms.length > 2 || activeFeatures.length > 3) && (
                                <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                                    +{Math.max(0, platforms.length - 2) + Math.max(0, activeFeatures.length - 3)}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <ChevronLeft className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                </div>
            </Link>
            
            <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Banknote className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground">كاش باك لكل لوت</p>
                            <p className="text-lg font-bold text-primary">${cashbackPerLot.toFixed(2)}</p>
                        </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {cashbackFrequency === 'Daily' ? 'يومي' : cashbackFrequency === 'Weekly' ? 'أسبوعي' : 'شهري'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button asChild size="sm" className="font-medium h-8 text-xs">
                        <Link href={`/dashboard/brokers/${broker.id}/link?action=new`}>
                            <TrendingUp className="h-3.5 w-3.5 ml-1" />
                            فتح حساب
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="font-medium h-8 text-xs">
                        <Link href={`/dashboard/brokers/${broker.id}/link?action=existing`}>
                            ربط حساب موجود
                        </Link>
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
  )
}
