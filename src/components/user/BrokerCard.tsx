
"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Broker } from "@/types";
import { Star, Info, Check, X, HandCoins } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function StarRating({ rating }: { rating: number }) {
    // Round rating to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                 const starValue = index + 1;
                 let fillClass = 'text-gray-300';
                 if (roundedRating >= starValue) {
                     fillClass = 'text-yellow-400 fill-yellow-400';
                 }
                return (
                     <Star key={index} className={`h-4 w-4 ${fillClass}`} />
                );
            })}
        </div>
    )
}

export function BrokerCard({ broker }: { broker: Broker }) {
  const name = broker.basicInfo.broker_name;
  const rating = (broker.reputation.wikifx_score ?? 0) / 2;
  const description = `Founded in ${broker.basicInfo.founded_year}`;
  const cashbackPerLot = broker.cashback.cashback_per_lot ?? 0;
  const cashbackFrequency = broker.cashback.cashback_frequency;
  const swapFree = broker.tradingConditions.swap_free;
  const copyTrading = broker.additionalFeatures.copy_trading;
  
  return (
    <Card className="w-full overflow-hidden">
        <CardContent className="p-3 space-y-3">
             <Link href={`/dashboard/brokers/${broker.id}`} className="block">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <Image
                            src={broker.logoUrl}
                            alt={`${name} logo`}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain rounded-md border p-1 flex-shrink-0 bg-white"
                            data-ai-hint="logo"
                        />
                        <div className="space-y-1">
                            <h3 className="text-base font-bold">{name}</h3>
                            <StarRating rating={rating} />
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{description}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </Link>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="space-y-1 text-center border-l pl-2">
                    <p className="text-xs text-muted-foreground">كاش باك لكل لوت</p>
                    <p className="font-bold text-lg text-primary">${cashbackPerLot.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{cashbackFrequency}</p>
                </div>
                <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-1.5 text-xs">
                         <HandCoins className="h-4 w-4 text-primary flex-shrink-0" />
                         <span className="flex-1">الخصومات متاحة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        {swapFree ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> : <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="flex-1">حساب إسلامي</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                       {copyTrading ? <Check className="h-4 w-4 text-green-500 flex-shrink-0" /> : <X className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="flex-1">نسخ التداول</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Button asChild className="w-full" size="sm">
                    <Link href={`/dashboard/brokers/${broker.id}/link?action=new`}>
                        فتح حساب جديد مع {name}.
                    </Link>
                </Button>
                <Button asChild className="w-full" variant="secondary" size="sm">
                    <Link href={`/dashboard/brokers/${broker.id}/link?action=existing`}>
                        لدي بالفعل حساب مع {name}.
                    </Link>
                </Button>
            </div>
        </CardContent>
    </Card>
  )
}
