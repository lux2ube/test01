
"use client";

import React, { useEffect, useState } from 'react';
import { useAuthContext } from "@/hooks/useAuthContext";
import { Loader2, ArrowLeft, Gem } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { ClientLevel } from '@/types';
import { useRouter } from 'next/navigation';
import { getClientLevels } from '@/app/actions';

export default function LoyaltyPage() {
    const { user, isLoading: isUserLoading } = useAuthContext();
    const [levels, setLevels] = useState<ClientLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchLevels() {
            setIsLoading(true);
            try {
                const data = await getClientLevels();
                setLevels(data);
            } catch (error) {
                console.error("Failed to fetch client levels", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLevels();
    }, []);

    const getCurrentLevel = (userLevel: number): ClientLevel | undefined => {
        return levels.find(l => l.id === userLevel);
    };

    const getNextLevel = (userLevel: number): ClientLevel | null => {
        if (userLevel >= levels.length) return null;
        return levels.find(l => l.id === userLevel + 1) || null;
    };

    if (isUserLoading || isLoading || !user || !user.profile || levels.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentLevel = getCurrentLevel(user.profile.level) || levels[0];
    const nextLevel = getNextLevel(user.profile.level);
    
    const monthlyEarnings = user.profile.monthlyEarnings || 0;

    const progress = nextLevel ? Math.min((monthlyEarnings / nextLevel.required_total) * 100, 100) : 100;
    const earningsNeeded = nextLevel ? Math.max(0, nextLevel.required_total - monthlyEarnings) : 0;

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى الإعدادات
            </Button>
            <PageHeader title="مستويات العملاء" description="اكسب المزيد كلما ارتقيت في المستوى." />

            <Card className="bg-gradient-to-tr from-primary to-accent text-primary-foreground overflow-hidden">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>مستواك الحالي</CardTitle>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/20">
                            <Gem className="h-4 w-4" />
                            <span className="font-bold">{currentLevel.name}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex justify-around text-center">
                    <div>
                        <p className="text-xs opacity-80">عمولة الكاش باك</p>
                        <p className="text-lg font-bold">{currentLevel.advantage_referral_cashback}%</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">عمولة المتجر</p>
                        <p className="text-lg font-bold">{currentLevel.advantage_referral_store}%</p>
                    </div>
                    <div>
                        <p className="text-xs opacity-80">خصم المتجر</p>
                        <p className="text-lg font-bold">{currentLevel.advantage_product_discount}%</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">تقدمك الشهري</CardTitle>
                </CardHeader>
                <CardContent>
                    {nextLevel ? (
                        <div className="space-y-3">
                            <Progress value={progress} />
                            <div className="flex justify-between text-sm">
                                <span className="font-semibold text-primary">${monthlyEarnings.toFixed(2)}</span>
                                <span className="text-muted-foreground">الهدف: ${nextLevel.required_total.toLocaleString()}</span>
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                أنت بحاجة إلى <span className="font-bold text-primary">${earningsNeeded.toFixed(2)}</span> أخرى للوصول إلى مستوى {nextLevel.name}.
                            </p>
                        </div>
                    ) : (
                        <p className="text-center font-semibold text-primary">لقد وصلت إلى أعلى مستوى! تهانينا!</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">المستويات التالية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {levels.filter(l => l.id > user.profile.level).slice(0, 3).map(level => (
                        <div key={level.id} className="p-3 rounded-md border">
                            <div className="flex justify-between items-center">
                               <h3 className="font-semibold">{level.name}</h3>
                               <p className="text-sm text-muted-foreground">يتطلب ${level.required_total.toLocaleString()}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs">
                                <div className="p-2 bg-muted/50 rounded-md">
                                    <p className="text-muted-foreground">كاش باك</p>
                                    <p className="font-bold">{level.advantage_referral_cashback}%</p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded-md">
                                    <p className="text-muted-foreground">متجر</p>
                                    <p className="font-bold">{level.advantage_referral_store}%</p>
                                </div>
                                <div className="p-2 bg-muted/50 rounded-md">
                                    <p className="text-muted-foreground">خصم</p>
                                    <p className="font-bold">{level.advantage_product_discount}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

        </div>
    );
}
