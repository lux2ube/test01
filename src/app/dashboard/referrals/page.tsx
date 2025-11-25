"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Users, Gift, Share2, UserPlus, Award, ArrowUpCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, ClientLevel } from "@/types";
import { format, subDays, subMonths, isAfter, startOfDay } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { getClientLevels, getUserReferralData } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';

type ReferralInfo = Pick<UserProfile, 'id' | 'name' | 'createdAt' | 'status'>;

type DatePeriod = 'all' | '7days' | '30days' | '3months' | '6months' | '1year';

interface ReferralWithEarnings extends ReferralInfo {
    totalEarned: number;
}

function ReferralsListTab({ 
    referrals, 
    earningsByUser,
    isLoading 
}: { 
    referrals: ReferralInfo[], 
    earningsByUser: Record<string, number>,
    isLoading: boolean 
}) {
    const [searchFilter, setSearchFilter] = useState('');
    const [dateFilter, setDateFilter] = useState<DatePeriod>('30days');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const filteredReferrals = useMemo(() => {
        let result = referrals;
        
        if (dateFilter !== 'all') {
            const now = new Date();
            let startDate: Date;
            
            switch (dateFilter) {
                case '7days':
                    startDate = startOfDay(subDays(now, 7));
                    break;
                case '30days':
                    startDate = startOfDay(subDays(now, 30));
                    break;
                case '3months':
                    startDate = startOfDay(subMonths(now, 3));
                    break;
                case '6months':
                    startDate = startOfDay(subMonths(now, 6));
                    break;
                case '1year':
                    startDate = startOfDay(subMonths(now, 12));
                    break;
                default:
                    startDate = new Date(0);
            }
            
            result = result.filter(ref => ref.createdAt && isAfter(ref.createdAt, startDate));
        }
        
        if (searchFilter) {
            const lowerCaseFilter = searchFilter.toLowerCase();
            result = result.filter(ref => 
                ref.name?.toLowerCase().includes(lowerCaseFilter)
            );
        }
        
        return result;
    }, [referrals, dateFilter, searchFilter]);

    const totalPages = Math.ceil(filteredReferrals.length / recordsPerPage);
    
    // Only calculate earnings for the paginated records (10 per page)
    const paginatedReferrals: ReferralWithEarnings[] = filteredReferrals
        .slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)
        .map(ref => ({
            ...ref,
            totalEarned: earningsByUser[ref.id] || 0
        }));

    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, searchFilter]);

    return (
        <Card>
            <CardHeader className="p-4 space-y-3">
                <div className="text-right">
                    <CardTitle className="text-base">سجل الإحالات الخاص بك</CardTitle>
                    <CardDescription className="text-xs">
                        قائمة بالمستخدمين الذين دعوتهم بنجاح.
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="بحث بالاسم..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="pr-10 h-9"
                        />
                    </div>
                    <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DatePeriod)}>
                        <SelectTrigger className="w-full sm:w-[140px] h-9">
                            <SelectValue placeholder="الفترة الزمنية" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">كل الفترات</SelectItem>
                            <SelectItem value="7days">آخر 7 أيام</SelectItem>
                            <SelectItem value="30days">آخر 30 يوم</SelectItem>
                            <SelectItem value="3months">آخر 3 أشهر</SelectItem>
                            <SelectItem value="6months">آخر 6 أشهر</SelectItem>
                            <SelectItem value="1year">آخر سنة</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">المستخدم</TableHead>
                                    <TableHead className="text-right">تاريخ الانضمام</TableHead>
                                    <TableHead className="text-left">الأرباح</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedReferrals.length > 0 ? paginatedReferrals.map(ref => (
                                    <TableRow key={ref.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="text-xs">{ref.name ? ref.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{ref.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {ref.createdAt ? format(ref.createdAt, 'PP') : '-'}
                                        </TableCell>
                                        <TableCell className="text-left font-semibold text-primary text-sm">
                                            ${ref.totalEarned.toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-sm text-muted-foreground">
                                            لم يتم العثور على إحالات.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between p-3 border-t">
                            <p className="text-xs text-muted-foreground">
                                صفحة {currentPage} من {Math.max(1, totalPages)}
                            </p>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setCurrentPage(p => Math.min(Math.max(1, totalPages), p + 1))}
                                    disabled={currentPage >= totalPages || totalPages === 0}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
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
    const [totalCommission, setTotalCommission] = useState(0);
    const [monthlyCommission, setMonthlyCommission] = useState(0);
    const [earningsByUser, setEarningsByUser] = useState<Record<string, number>>({});
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
                setTotalCommission(referralData.totalCommission);
                setMonthlyCommission(referralData.monthlyCommission);
                setEarningsByUser(referralData.earningsByUser);
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
        const totalReferrals = referrals.length;
        const totalActive = referrals.filter(r => r.status === 'Active' || r.status === 'Trader').length;
        return { monthlyEarnings: monthlyCommission, totalReferrals, totalActive };
    }, [monthlyCommission, referrals]);

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
    // Use monthly commission for loyalty progress (resets each month)
    const progress = nextLevel && !isLoading ? Math.min((monthlyCommission / nextLevel.required_total) * 100, 100) : 0;


    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="ادع واربح"
                description="شارك الحب واحصل على مكافأة مقابل كل صديق تدعوه."
            />
            
            <div className="grid grid-cols-3 gap-2">
                <StatCard title="أرباح هذا الشهر" value={`$${stats.monthlyEarnings.toFixed(2)}`} icon={Gift} />
                <StatCard title="إجمالي الإحالات" value={stats.totalReferrals} icon={Users} />
                <StatCard title="النشطون" value={stats.totalActive} icon={UserPlus} />
            </div>
            
            <Card>
                <CardHeader className="p-3 text-right">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm">مستوى الولاء الخاص بك</CardTitle>
                        <Badge variant="secondary" className="gap-1.5"><Award className="h-3 w-3 text-primary"/>{currentLevel?.name || '-'}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-1 rounded-md bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">عمولة الكاش باك</p>
                            <p className="font-bold text-primary">{currentLevel?.advantage_referral_cashback || 0}%</p>
                        </div>
                        <div className="p-1 rounded-md bg-muted/50">
                            <p className="text-[10px] text-muted-foreground">عمولة المتجر</p>
                            <p className="font-bold text-primary">{currentLevel?.advantage_referral_store || 0}%</p>
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

            <ReferralsListTab 
                referrals={referrals} 
                earningsByUser={earningsByUser}
                isLoading={isLoading} 
            />
        </div>
    );
}
