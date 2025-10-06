
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import type { TradingAccount, CashbackTransaction } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

export default function AccountDetailPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const params = useParams();
    const accountId = params.accountId as string;

    const [account, setAccount] = useState<TradingAccount | null>(null);
    const [transactions, setTransactions] = useState<CashbackTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !accountId) {
                setIsLoading(false);
                return;
            }
            
            try {
                const supabase = createClient();
                
                const { data: accountData, error: accountError } = await supabase
                    .from('trading_accounts')
                    .select('*')
                    .eq('id', accountId)
                    .eq('user_id', user.id)
                    .single();

                if (accountError || !accountData) {
                    setIsLoading(false);
                    return notFound();
                }

                setAccount({
                    id: accountData.id,
                    userId: accountData.user_id,
                    broker: accountData.broker,
                    accountNumber: accountData.account_number,
                    status: accountData.status,
                    createdAt: new Date(accountData.created_at),
                    rejectionReason: accountData.rejection_reason,
                } as TradingAccount);

                const { data: transactionsData, error: transactionsError } = await supabase
                    .from('cashback_transactions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('account_id', accountId)
                    .order('date', { ascending: false });

                if (!transactionsError && transactionsData) {
                    const userTransactions = transactionsData.map(item => ({
                        id: item.id,
                        userId: item.user_id,
                        accountId: item.account_id,
                        accountNumber: item.account_number,
                        broker: item.broker,
                        date: new Date(item.date),
                        tradeDetails: item.trade_details,
                        cashbackAmount: item.cashback_amount,
                        referralBonusTo: item.referral_bonus_to,
                        referralBonusAmount: item.referral_bonus_amount,
                        sourceUserId: item.source_user_id,
                        sourceType: item.source_type,
                        transactionId: item.transaction_id,
                        note: item.note,
                    } as CashbackTransaction));
                    setTransactions(userTransactions);
                }

            } catch (error) {
                console.error("Error fetching data: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, accountId]);
    
    const totalEarned = useMemo(() => {
        return transactions.reduce((sum, tx) => sum + tx.cashbackAmount, 0);
    }, [transactions]);
    
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Approved': return 'default';
            case 'Pending': return 'secondary';
            case 'Rejected': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusText = (status: string) => {
        switch (status) {
            case 'Approved': return 'مقبول';
            case 'Pending': return 'معلق';
            case 'Rejected': return 'مرفوض';
            default: return status;
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!account) {
        return notFound();
    }

    return (
        <div className="container mx-auto px-4 py-4 max-w-2xl space-y-4">
             <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى حساباتي
            </Button>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{account.broker}</CardTitle>
                            <CardDescription>الحساب: {account.accountNumber}</CardDescription>
                        </div>
                         <Badge variant={getStatusVariant(account.status)}>{getStatusText(account.status)}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {account.status === 'Rejected' && account.rejectionReason && (
                        <Alert variant="destructive" className="mb-4">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>سبب الرفض</AlertTitle>
                            <AlertDescription>{account.rejectionReason}</AlertDescription>
                        </Alert>
                    )}
                    {account.status === 'Approved' && (
                        <p className="text-lg">
                            إجمالي الكاش باك المكتسب: <span className="font-bold text-primary">${totalEarned.toFixed(2)}</span>
                        </p>
                    )}
                     {account.status === 'Pending' && (
                        <p className="text-sm text-muted-foreground">
                            هذا الحساب قيد الموافقة حاليًا. سيتم إعلامك بمجرد مراجعته.
                        </p>
                    )}
                </CardContent>
            </Card>

            {account.status === 'Approved' && (
                <Card>
                    <CardHeader>
                        <CardTitle>سجل الكاش باك</CardTitle>
                        <CardDescription>
                            جميع المعاملات لهذا الحساب.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>التفاصيل</TableHead>
                                        <TableHead className="text-right">الكاش باك</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? (
                                        transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium whitespace-nowrap">{format(tx.date, "PP")}</TableCell>
                                                <TableCell>{tx.tradeDetails}</TableCell>
                                                <TableCell className="text-right font-semibold text-primary">${tx.cashbackAmount.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24">
                                                لم يتم العثور على معاملات لهذا الحساب بعد.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
