
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Briefcase, CheckCircle, Clock, XCircle, Wifi, Cpu, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { getUserTradingAccounts, getCashbackTransactions } from "@/app/actions";
import { cn } from "@/lib/utils";

function AccountCard({ account, totalEarned }: { account: TradingAccount, totalEarned: number }) {
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Approved': return 'مقبول';
            case 'Pending': return 'معلق';
            case 'Rejected': return 'مرفوض';
            default: return status;
        }
    }
    
    const getStatusClasses = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700';
            case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700';
            case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        }
    };


    if (account.status === 'Approved') {
        return (
             <Link href={`/dashboard/my-accounts/${account.id}`} className="block h-full">
                <Card className="h-full bg-slate-800 text-white shadow-lg overflow-hidden relative group hover:scale-105 transition-transform duration-300">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <CardContent className="p-4 flex flex-col justify-between h-full text-right">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                               <Badge variant="secondary" className={cn("bg-white/20 text-white border-transparent", getStatusClasses(account.status))}>{getStatusText(account.status)}</Badge>
                                <Briefcase className="w-6 h-6 text-gray-400" />
                            </div>
                        </div>
                        <div className="relative z-10 space-y-1">
                            <p className="font-mono text-lg tracking-wider text-left">
                                {account.accountNumber}
                            </p>
                            <div className="flex justify-between items-end">
                                <div className="space-y-0 text-left">
                                     <p className="text-xs text-gray-400 uppercase">المكتسب</p>
                                     <p className="font-bold text-primary">${totalEarned.toFixed(2)}</p>
                                </div>
                                <div className="space-y-0">
                                     <p className="text-xs text-gray-400 uppercase">الوسيط</p>
                                     <p className="font-semibold">{account.broker}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </Link>
        )
    }

    // Standard card for Pending/Rejected accounts
    return (
        <Link href={`/dashboard/my-accounts/${account.id}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors h-full">
                 <CardContent className="p-4 flex items-center gap-4 text-right">
                    <div className="p-3 bg-muted rounded-lg">
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-grow space-y-1">
                        <p className="font-semibold">{account.broker}</p>
                        <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                        {account.status === 'Rejected' && account.rejectionReason && (
                            <p className="text-xs text-destructive flex items-center gap-1.5 pt-1">
                                <XCircle className="h-3 w-3"/>{account.rejectionReason}
                            </p>
                        )}
                    </div>
                     <div className="flex flex-col items-end gap-2 self-start">
                        <Badge className={cn("gap-1.5 h-6", getStatusClasses(account.status))}>
                            {account.status === 'Pending' && <Clock className="h-3 w-3" />}
                            {account.status === 'Rejected' && <XCircle className="h-3 w-3" />}
                            {getStatusText(account.status)}
                        </Badge>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-muted-foreground mr-auto self-center" />
                </CardContent>
            </Card>
        </Link>
    );
}

export default function MyAccountsPage() {
    const { user } = useAuthContext();
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const [fetchedAccounts, userTransactions] = await Promise.all([
                    getUserTradingAccounts(),
                    getCashbackTransactions()
                ]);
                
                const userAccounts = fetchedAccounts;
                userAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setAccounts(userAccounts);
                setTransactions(userTransactions);
                
            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const transactionsByAccountId = useMemo(() => {
        return transactions.reduce((acc, tx) => {
            if (!acc[tx.accountId]) {
                acc[tx.accountId] = 0;
            }
            acc[tx.accountId] += tx.cashbackAmount;
            return acc;
        }, {} as Record<string, number>);
    }, [transactions]);
    
    const accountLists = useMemo(() => ({
        all: accounts,
        approved: accounts.filter(a => a.status === 'Approved'),
        pending: accounts.filter(a => a.status === 'Pending'),
        rejected: accounts.filter(a => a.status === 'Rejected'),
    }), [accounts]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const renderAccountList = (accountList: TradingAccount[]) => {
        if (accountList.length === 0) {
            return (
                <div className="text-center py-10 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground text-sm">لم يتم العثور على حسابات في هذه الفئة.</p>
                </div>
            );
        }
       
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accountList.map(account => (
                    <AccountCard 
                        key={account.id} 
                        account={account} 
                        totalEarned={transactionsByAccountId[account.id] || 0}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="حساباتي"
                    description="حسابات تداول الفوركس المرتبطة بك."
                />
                <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/brokers">
                        <PlusCircle className="ml-2 h-4 w-4" />
                        ربط حساب جديد
                    </Link>
                </Button>
            </div>
            
             {accounts.length === 0 ? (
                 <div className="text-center py-20 border rounded-lg bg-muted/30">
                    <p className="text-muted-foreground">لم تقم بربط أي حسابات بعد.</p>
                    <Button asChild size="sm" className="mt-4">
                        <Link href="/dashboard/brokers">اربط حسابك الأول</Link>
                    </Button>
                </div>
             ) : (
                 <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">الكل</TabsTrigger>
                        <TabsTrigger value="approved">المقبولة</TabsTrigger>
                        <TabsTrigger value="pending">
                            المعلقة
                            {accountLists.pending.length > 0 && <Badge className="mr-2 bg-amber-500">{accountLists.pending.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="rejected">
                            المرفوضة
                            {accountLists.rejected.length > 0 && <Badge variant="destructive" className="mr-2">{accountLists.rejected.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-4">
                        {renderAccountList(accountLists.all)}
                    </TabsContent>
                    <TabsContent value="approved" className="mt-4">
                        {renderAccountList(accountLists.approved)}
                    </TabsContent>
                    <TabsContent value="pending" className="mt-4">
                        {renderAccountList(accountLists.pending)}
                    </TabsContent>
                    <TabsContent value="rejected" className="mt-4">
                        {renderAccountList(accountLists.rejected)}
                    </TabsContent>
                </Tabs>
             )}
        </div>
    );
}
