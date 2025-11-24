
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, ArrowUpCircle, ArrowDownCircle, Gift, ShoppingBag, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getUnifiedTransactionHistory, type UnifiedTransaction } from "@/app/actions";

const getTransactionIcon = (type: UnifiedTransaction['type']) => {
    switch (type) {
        case 'cashback':
            return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
        case 'referral_commission':
            return <Gift className="h-4 w-4 text-purple-500" />;
        case 'referral_reversal':
            return <Gift className="h-4 w-4 text-red-500" />;
        case 'withdrawal':
            return <Wallet className="h-4 w-4 text-orange-500" />;
        case 'order':
            return <ShoppingBag className="h-4 w-4 text-blue-500" />;
        default:
            return <ArrowDownCircle className="h-4 w-4" />;
    }
};

const getTransactionBadgeVariant = (type: UnifiedTransaction['type']) => {
    switch (type) {
        case 'cashback':
            return 'default';
        case 'referral_commission':
            return 'secondary';
        case 'referral_reversal':
            return 'destructive';
        case 'withdrawal':
            return 'outline';
        case 'order':
            return 'outline';
        default:
            return 'secondary';
    }
};

export default function TransactionsPage() {
    const { user } = useAuthContext();
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            
            setIsLoading(true);
            try {
                const userTransactions = await getUnifiedTransactionHistory();
                setTransactions(userTransactions);
            } catch (error) {
                console.error("Error fetching transactions: ", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const filteredTransactions = useMemo(() => {
        if (!filter) return transactions;
        const lowerCaseFilter = filter.toLowerCase();
        return transactions.filter(tx => 
            tx.description.toLowerCase().includes(lowerCaseFilter) ||
            tx.details.toLowerCase().includes(lowerCaseFilter) ||
            tx.type.toLowerCase().includes(lowerCaseFilter)
        );
    }, [transactions, filter]);

    const stats = useMemo(() => {
        const earned = transactions
            .filter(tx => tx.amount > 0)
            .reduce((sum, tx) => sum + tx.amount, 0);
        const spent = transactions
            .filter(tx => tx.amount < 0)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        return { earned, spent };
    }, [transactions]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh_-_theme(spacing.12))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 max-w-4xl space-y-6">
            <PageHeader
                title="المعاملات"
                description="سجل كامل بجميع المعاملات المالية الخاصة بك."
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-right text-sm text-muted-foreground">إجمالي المكتسب</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-primary text-right">${stats.earned.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-right text-sm text-muted-foreground">إجمالي المصروف</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-500 text-right">${stats.spent.toFixed(2)}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <CardTitle className="text-right">سجل المعاملات</CardTitle>
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="فلترة حسب النوع، التفاصيل..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full sm:w-auto pr-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">التاريخ</TableHead>
                                <TableHead className="text-right">النوع</TableHead>
                                <TableHead className="text-right">التفاصيل</TableHead>
                                <TableHead className="text-left">المبلغ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(tx => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="text-muted-foreground text-xs md:text-sm">
                                          {format(tx.date, "PP")}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getTransactionIcon(tx.type)}
                                                <Badge variant={getTransactionBadgeVariant(tx.type) as any}>
                                                    {tx.description}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="max-w-[250px] truncate md:max-w-none md:whitespace-normal text-sm">
                                                {tx.details || '-'}
                                            </p>
                                        </TableCell>
                                        <TableCell className={`text-left font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)}$
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        لم يتم العثور على معاملات.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
