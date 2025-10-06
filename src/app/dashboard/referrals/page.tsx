
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, KeyRound, Link as LinkIcon, Users, Gift, Share2, UserPlus, Award, ArrowUpCircle, BarChart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, UserStatus, CashbackTransaction, ClientLevel } from "@/types";
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import { getClientLevels, getUserReferralData } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

type ReferralInfo = Pick<UserProfile, 'id' | 'name' | 'createdAt' | 'status'>;

const getStatusText = (status: UserStatus) => {
    switch (status) {
        case 'NEW': return 'جديد';
        case 'Active': return 'نشط';
        case 'Trader': return 'متداول';
        default: return 'غير معروف';
    }
};

const getStatusVariant = (status: UserStatus) => {
    switch (status) {
        case 'NEW': return 'secondary';
        case 'Active': return 'outline';
        case 'Trader': return 'default';
        default: return 'secondary';
    }
};


function CommissionHistoryTab({ history, isLoading }: { history: CashbackTransaction[], isLoading: boolean }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-base text-right">سجل العمولات</CardTitle>
                <CardDescription className="text-xs text-right">
                    جميع العمولات التي كسبتها من إحالاتك.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">التاريخ</TableHead>
                            <TableHead className="text-right">المصدر</TableHead>
                            <TableHead className="text-left">المبلغ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.length > 0 ? history.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell className="text-xs">{format(tx.date, "PP")}</TableCell>
                                <TableCell>
                                    <p className="text-xs font-medium">{tx.tradeDetails}</p>
                                    <p className="text-xs text-muted-foreground">
                                        من {tx.sourceType === 'cashback' ? 'كاش باك' : 'شراء من المتجر'}
                                    </p>
                                </TableCell>
                                <TableCell className="text-left font-semibold text-primary text-xs">
                                    +${tx.cashbackAmount.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-sm text-muted-foreground">
                                    لم تكسب أي عمولات بعد.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


function ReferralsListTab({ referrals, isLoading }: { referrals: ReferralInfo[], isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="p-4 text-right">
                <CardTitle className="text-base">سجل الإحالات الخاص بك</CardTitle>
                <CardDescription className="text-xs">
                    قائمة بالمستخدمين الذين دعوتهم بنجاح.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="space-y-1 p-2 max-h-80 overflow-y-auto">
                     {isLoading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : referrals.length > 0 ? (
                        referrals.map(ref => (
                            <div key={ref.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                <Avatar>
                                    <AvatarFallback>{ref.name ? ref.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <p className="font-medium text-sm">{ref.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        انضم في {ref.createdAt ? format(ref.createdAt, 'PP') : '-'}
                                    </p>
                                </div>
                                <Badge variant={getStatusVariant(ref.status)}>{getStatusText(ref.status)}</Badge>
                            </div>
                        ))
                    ) : (
                        <div className="text-center h-24 flex items-center justify-center text-sm text-muted-foreground">
                            لم تقم بإحالة أي شخص بعد.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <div className="flex items-center gap-2 mt-1">
          <Icon className="h-4 w-4 text-primary" />
          <p className="text-lg font-bold">{value}</p>
      </div>
    </Card>
  );
}


export default function ReferralsPage() {
    const { user, isLoading: isUserLoading } = useAuthContext();
    const { toast } = useToast();
    const [levels, setLevels] = useState<ClientLevel[]>([]);
    const [referrals, setReferrals] = useState<ReferralInfo[]>([]);
    const [commissionHistory, setCommissionHistory] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const referralLink = user && typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${user.profile?.referralCode}` : '';
    const referralCode = user?.profile?.referralCode || '';
    
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !user.profile) {
                setIsLoading(false);
                return;
            };

            setIsLoading(true);

            try {
                const [levelsData, referralData] = await Promise.all([
                    getClientLevels(),
                    getUserReferralData()
                ]);

                setLevels(levelsData);
                setCommissionHistory(referralData.commissionHistory);
                setReferrals(referralData.referrals);
            } catch(e) {
                console.error("Failed to fetch referral page data", e);
                toast({ variant: 'destructive', title: "خطأ", description: "فشل تحميل بيانات الإحالة."});
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, toast]);

    const stats = useMemo(() => {
        const totalEarnings = commissionHistory.reduce((sum, tx) => sum + tx.cashbackAmount, 0);
        const totalReferrals = referrals.length;
        const totalActive = referrals.filter(r => r.status === 'Active' || r.status === 'Trader').length;
        return { totalEarnings, totalReferrals, totalActive };
    }, [commissionHistory, referrals]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!' });
    };
    
     const handleShare = () => {
        const shareText = `أنا أستخدم رفيق الكاش باك لكسب المال على تداولاتي. استخدم الكود الخاص بي '${referralCode}' عند التسجيل!`;
        const shareData = {
            title: 'انضم إلى رفيق الكاش باك!',
            text: shareText,
            url: referralLink,
        };
        
        try {
            if (navigator.share) {
                navigator.share(shareData).catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error('Error sharing:', err);
                        copyToClipboard(referralLink);
                        toast({title: 'تم نسخ الرابط', description: 'حدث خطأ أثناء المشاركة، تم نسخ الرابط بدلاً من ذلك.'})
                    }
                });
            } else {
                throw new Error("Web Share API not supported");
            }
        } catch (err) {
            copyToClipboard(referralLink);
            toast({title: 'تم نسخ الرابط', description: 'المشاركة غير مدعومة على هذا الجهاز، تم نسخ الرابط بدلاً من ذلك.'})
        }
    };

    if (isUserLoading || isLoading) {
        return (
             <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentLevel = levels.find(l => l.id === user?.profile?.level) || levels[0];
    const nextLevel = levels.find(l => l.id === (user?.profile?.level || 0) + 1);
    const monthlyEarnings = user?.profile?.monthlyEarnings || 0;
    const progress = nextLevel && !isLoading ? Math.min((monthlyEarnings / nextLevel.required_total) * 100, 100) : 0;


    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="ادع واربح"
                description="شارك الحب واحصل على مكافأة مقابل كل صديق تدعوه."
            />
            
            <div className="grid grid-cols-3 gap-2">
                <StatCard title="إجمالي الأرباح" value={`$${stats.totalEarnings.toFixed(2)}`} icon={Gift} />
                <StatCard title="إجمالي الإحالات" value={stats.totalReferrals} icon={Users} />
                <StatCard title="النشطون" value={stats.totalActive} icon={UserPlus} />
            </div>
            
            <Card>
                <CardHeader className="p-3 text-right">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">مستوى الولاء الخاص بك</CardTitle>
                        <Badge variant="secondary" className="gap-1.5"><Award className="h-3 w-3 text-primary"/>{currentLevel.name}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-1 rounded-md bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">عمولة الكاش باك</p>
                            <p className="font-bold text-primary">{currentLevel.advantage_referral_cashback}%</p>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">عمولة المتجر</p>
                            <p className="font-bold text-primary">{currentLevel.advantage_referral_store}%</p>
                        </div>
                    </div>
                    {nextLevel && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-1.5"/>
                            <Button asChild variant="link" size="sm" className="w-full text-xs h-auto p-0 text-primary hover:text-primary/80">
                                <Link href="/dashboard/loyalty">
                                    <ArrowUpCircle className="ml-1 h-3 w-3" />
                                    ارتق إلى {nextLevel.name} لتكسب أكثر!
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="p-3 text-right">
                    <CardTitle className="text-base">شارك واربح</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                     <div className="space-y-1">
                        <Label htmlFor="referral-code">كود الإحالة الخاص بك</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly id="referral-code" value={referralCode} className="h-9 text-base text-center font-mono bg-muted flex-grow" />
                            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(referralCode)}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                     <div className="space-y-1">
                       <Label htmlFor="referral-link">رابط الإحالة الخاص بك</Label>
                       <div className="flex items-center gap-2">
                           <Input readOnly id="referral-link" value={referralLink} className="h-9 text-xs font-mono bg-muted flex-grow" />
                           <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={handleShare}>
                               <Share2 className="h-4 w-4" />
                           </Button>
                           <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(referralLink)}>
                               <Copy className="h-4 w-4" />
                           </Button>
                       </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="referrals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="referrals">إحالاتي</TabsTrigger>
                    <TabsTrigger value="history">سجل العمولات</TabsTrigger>
                </TabsList>
                <TabsContent value="referrals" className="mt-4">
                    <ReferralsListTab referrals={referrals} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                   <CommissionHistoryTab history={commissionHistory} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
