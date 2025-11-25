"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, ArrowUpCircle, ArrowDownCircle, Gift, ShoppingBag, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, subMonths, isAfter, startOfDay } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUnifiedTransactionHistory, type UnifiedTransaction } from "@/app/actions";

const getTransactionIcon = (type: UnifiedTransaction['type']) => {
    switch (type) {
        case 'cashback':
            return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
        case 'referral_commission':
            return <Gift className="h-4 w-4 text-purple-500" />;
        case 'referral_reversal':
            return <Gift className="h-4 w-4 text-red-500" />;
        case 'order':
        case 'order_created':
            return <ShoppingBag className="h-4 w-4 text-blue-500" />;
        case 'order_cancelled':
            return <XCircle className="h-4 w-4 text-orange-500" />;
        default:
            return <ArrowDownCircle className="h-4 w-4" />;
    }
};

type TransactionTypeFilter = 'all' | 'cashback' | 'referral_commission' | 'store_orders';
type DatePeriod = 'all' | '7days' | '30days' | '3months' | '6months' | '1year';

export default function TransactionsPage() {
    const { user } = useAuthContext();
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchFilter, setSearchFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
    const [dateFilter, setDateFilter] = useState<DatePeriod>('all');

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
        let result = transactions;
        
        if (typeFilter !== 'all') {
            if (typeFilter === 'store_orders') {
                result = result.filter(tx => 
                    tx.type === 'order' || tx.type === 'order_created' || tx.type === 'order_cancelled'
                );
            } else {
                result = result.filter(tx => tx.type === typeFilter);
            }
        }
        
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
            
            result = result.filter(tx => isAfter(tx.date, startDate));
        }
        
        if (searchFilter) {
            const lowerCaseFilter = searchFilter.toLowerCase();
            result = result.filter(tx => 
                tx.description.toLowerCase().includes(lowerCaseFilter) ||
                tx.details.toLowerCase().includes(lowerCaseFilter)
            );
        }
        
        return result;
    }, [transactions, typeFilter, dateFilter, searchFilter]);

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

            <Card>
                <CardHeader className="space-y-4">
                    <CardTitle className="text-right">سجل المعاملات</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="بحث..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TransactionTypeFilter)}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="نوع المعاملة" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="cashback">كاش باك</SelectItem>
                                <SelectItem value="referral_commission">عمولة إحالة</SelectItem>
                                <SelectItem value="store_orders">طلبات المتجر</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DatePeriod)}>
                            <SelectTrigger className="w-full sm:w-[160px]">
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
                                                <span className="text-sm">{tx.description}</span>
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
