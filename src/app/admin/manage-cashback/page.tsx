"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, XCircle, Edit, DollarSign, History, AlertTriangle } from 'lucide-react';
import { addCashbackTransaction, getCashbackHistory } from "./actions";
import type { TradingAccount, CashbackTransaction, UserProfile, Broker } from '@/types';
import { useAdminData } from '@/hooks/useAdminData';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { FilterFn } from '@tanstack/react-table';

const formSchema = z.object({
  tradeDetails: z.string().min(3, { message: "الرجاء إدخال تفاصيل الصفقة." }),
  cashbackAmount: z.coerce.number().positive({ message: "يجب أن يكون المبلغ أكبر من صفر." }),
});

type EnrichedAccount = TradingAccount & { userName: string; userEmail: string };
type EnrichedCashback = CashbackTransaction & { userProfile?: Partial<UserProfile> };

export default function ManageCashbackPage() {
    const { users, accounts, brokers, isLoading: isDataLoading } = useAdminData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<EnrichedAccount | null>(null);
    const [transactions, setTransactions] = useState<EnrichedCashback[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);
    const [duplicateWarning, setDuplicateWarning] = useState<{ show: boolean, onConfirm: () => void }>({ show: false, onConfirm: () => {} });

    const fetchHistory = useCallback(async () => {
        setIsHistoryLoading(true);
        try {
            const history = await getCashbackHistory();
            setTransactions(history);
        } catch (e) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل تحميل سجل المعاملات.' });
        } finally {
            setIsHistoryLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tradeDetails: '',
            cashbackAmount: 0,
        }
    });

    const enrichedAccounts = useMemo(() => {
        if (isDataLoading) return [];
        return accounts
            .filter(acc => acc.status === 'Approved')
            .map(acc => {
                const user = users.find(u => u.id === acc.userId);
                return {
                    ...acc,
                    userName: user?.name || 'مستخدم غير معروف',
                    userEmail: user?.email || 'لا يوجد بريد إلكتروني',
                };
            });
    }, [accounts, users, isDataLoading]);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        return enrichedAccounts.filter(acc => 
            acc.userName.toLowerCase().includes(lowerCaseQuery) ||
            acc.userEmail.toLowerCase().includes(lowerCaseQuery) ||
            acc.accountNumber.toLowerCase().includes(lowerCaseQuery)
        );
    }, [searchQuery, enrichedAccounts]);

    const checkForDuplicates = (values: z.infer<typeof formSchema>): boolean => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return transactions.some(tx => 
            tx.accountId === selectedAccount?.id &&
            tx.cashbackAmount === values.cashbackAmount &&
            tx.date > oneWeekAgo
        );
    };

    const performSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!selectedAccount) return;
        setIsSubmitting(true);
        
        const result = await addCashbackTransaction({
            userId: selectedAccount.userId,
            accountId: selectedAccount.id,
            accountNumber: selectedAccount.accountNumber,
            broker: selectedAccount.broker,
            tradeDetails: values.tradeDetails,
            cashbackAmount: values.cashbackAmount,
        });

        if (result.success) {
            toast({ title: 'نجاح', description: result.message });
            form.reset();
            setSelectedAccount(null);
            setSearchQuery('');
            fetchHistory();
        } else {
            toast({ variant: 'destructive', title: 'خطأ', description: result.message });
        }
        setIsSubmitting(false);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (checkForDuplicates(values)) {
            setDuplicateWarning({ show: true, onConfirm: () => performSubmit(values) });
        } else {
            await performSubmit(values);
        }
    }
    
    const handleSelectAccount = (account: EnrichedAccount) => {
        setSelectedAccount(account);
        setSearchQuery('');
    }

    const clearSelection = () => {
        setSelectedAccount(null);
        form.reset();
    }
    
    const brokerFilterOptions = useMemo(() => {
        return brokers.map(broker => ({
            value: broker.name,
            label: broker.name,
        }));
    }, [brokers]);

     const globalFilterFn: FilterFn<EnrichedCashback> = (row, columnId, value, addMeta) => {
        const lowercasedValue = value.toLowerCase();
        const { userProfile, accountNumber, broker, tradeDetails, cashbackAmount } = row.original;
        
        const searchableText = [
            userProfile?.name,
            userProfile?.email,
            userProfile?.clientId?.toString(),
            accountNumber,
            broker,
            tradeDetails,
            cashbackAmount.toString()
        ].join(' ').toLowerCase();

        return searchableText.includes(lowercasedValue);
    };

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="إدارة الكاش باك" description="إضافة معاملات الكاش باك للمستخدمين يدويًا." />
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. البحث عن حساب</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isDataLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                            ) : selectedAccount ? (
                                <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="font-semibold">{selectedAccount.userName}</p>
                                        <p className="text-sm text-muted-foreground">{selectedAccount.broker} - {selectedAccount.accountNumber}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={clearSelection}>
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            placeholder="بحث بالاسم، البريد، أو الحساب..."
                                            className="pr-10"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {searchQuery && (
                                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md">
                                            {searchResults.length > 0 ? searchResults.map(acc => (
                                                <button 
                                                    key={acc.id} 
                                                    className="w-full text-right p-3 hover:bg-muted"
                                                    onClick={() => handleSelectAccount(acc)}
                                                >
                                                    <p className="font-medium">{acc.userName} ({acc.accountNumber})</p>
                                                    <p className="text-sm text-muted-foreground">{acc.userEmail}</p>
                                                </button>
                                            )) : (
                                                <p className="p-4 text-center text-sm text-muted-foreground">لم يتم العثور على حسابات.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className={!selectedAccount ? 'opacity-50 pointer-events-none' : ''}>
                        <CardHeader>
                            <CardTitle>2. إضافة التفاصيل</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="tradeDetails"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>تفاصيل الصفقة</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Edit className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="مثال: 5.0 لوت EUR/USD" {...field} className="pr-10" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="cashbackAmount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>مبلغ الكاش باك ($)</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input type="number" placeholder="مثال: 25.50" {...field} className="pr-10" />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={isSubmitting || !selectedAccount}>
                                        {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                        إضافة معاملة
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                    {isHistoryLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={transactions}
                            globalFilterFn={globalFilterFn}
                            searchPlaceholder="بحث في المعاملات..."
                            filterableColumns={[
                                {
                                    id: 'broker',
                                    title: 'الوسيط',
                                    options: brokerFilterOptions,
                                }
                            ]}
                        />
                    )}
                </div>
            </div>

            <AlertDialog open={duplicateWarning.show} onOpenChange={(open) => !open && setDuplicateWarning({ show: false, onConfirm: () => {} })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500" /> تحذير من معاملة مكررة</AlertDialogTitle>
                        <AlertDialogDescription>
                            يبدو أنه تم إضافة نفس المبلغ لنفس الحساب خلال الأسبوع الماضي. هل أنت متأكد أنك تريد المتابعة؟
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDuplicateWarning({ show: false, onConfirm: () => {} })}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            duplicateWarning.onConfirm();
                            setDuplicateWarning({ show: false, onConfirm: () => {} });
                        }}>نعم، متابعة</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
