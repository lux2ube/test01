
"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"
import { Info, Loader2, Copy, Banknote, XCircle, Wallet, Briefcase, History, ArrowDownToLine, ArrowUpFromLine, ChevronLeft } from "lucide-react";
import type { Withdrawal, PaymentMethod, TradingAccount } from "@/types";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getUserBalance, requestWithdrawal, getUserWithdrawals, getUserTradingAccounts } from "@/app/actions";
import { getPaymentMethods } from "@/app/admin/manage-payment-methods/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";


const withdrawalSchema = z.object({
    amount: z.coerce.number().positive({ message: "يجب أن يكون المبلغ أكبر من صفر." }),
    withdrawalType: z.enum(['payment_method', 'trading_account']),
    paymentMethodId: z.string().optional(),
    tradingAccountId: z.string().optional(),
    details: z.record(z.string()),
}).refine(data => {
    if (data.withdrawalType === 'payment_method') return !!data.paymentMethodId;
    if (data.withdrawalType === 'trading_account') return !!data.tradingAccountId;
    return false;
}, {
    message: "الرجاء اختيار وجهة.",
    path: ["paymentMethodId"],
});

type FormValues = z.infer<typeof withdrawalSchema>;


function WithdrawTabContent() {
    const { user } = useAuthContext();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    
    const [availableBalance, setAvailableBalance] = useState(0);
    const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
    const [adminPaymentMethods, setAdminPaymentMethods] = useState<PaymentMethod[]>([]);
    const [userTradingAccounts, setUserTradingAccounts] = useState<TradingAccount[]>([]);
    
    const [formDefaultValues, setFormDefaultValues] = useState<FormValues>({
        amount: 0,
        withdrawalType: 'payment_method',
        details: {},
    });
    
    const cryptoPaymentMethods = useMemo(() => adminPaymentMethods.filter(m => m.type === 'crypto' && m.isEnabled), [adminPaymentMethods]);

    const fetchData = useCallback(async () => {
        if (user) {
            setIsFetching(true);
            try {
                const [balanceData, withdrawalsData, adminMethodsData, accountsData] = await Promise.all([
                    getUserBalance(),
                    getUserWithdrawals(),
                    getPaymentMethods(),
                    getUserTradingAccounts(),
                ]);

                setAvailableBalance(balanceData.availableBalance);
                
                const allPossibleDetailFields = adminMethodsData.reduce((acc, method) => {
                    method.fields.forEach(field => {
                        acc[field.name] = '';
                    });
                    return acc;
                }, {} as Record<string, string>);

                setAdminPaymentMethods(adminMethodsData);
                setFormDefaultValues({
                    amount: 0,
                    withdrawalType: 'payment_method',
                    paymentMethodId: undefined,
                    tradingAccountId: undefined,
                    details: allPossibleDetailFields,
                });

                const withdrawals = withdrawalsData;
                const tradingAccounts = accountsData.filter(acc => acc.status === 'Approved');
                 setUserTradingAccounts(tradingAccounts);
                
                withdrawals.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
                setRecentWithdrawals(withdrawals);

            } catch (error) {
                console.error("Error fetching withdrawal data:", error);
                toast({ variant: 'destructive', title: "خطأ", description: "فشل تحميل بيانات الصفحة."});
            } finally {
                setIsFetching(false);
            }
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    const form = useForm<FormValues>({
        resolver: zodResolver(withdrawalSchema),
        values: formDefaultValues,
        mode: "onBlur",
    });

    const withdrawalType = form.watch("withdrawalType");
    const selectedMethodId = form.watch("paymentMethodId");
    
    const selectedMethod = useMemo(() => {
        return adminPaymentMethods.find(m => m.id === selectedMethodId);
    }, [adminPaymentMethods, selectedMethodId]);


    async function onSubmit(values: FormValues) {
        if (!user) return;
        
        let finalDetails: Record<string, any> = {};
        let paymentMethodName = '';
        let withdrawalType = '';

        if (values.withdrawalType === 'trading_account') {
            const account = userTradingAccounts.find(a => a.id === values.tradingAccountId);
            if (!account) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'حساب التداول المحدد غير صالح.' });
                return;
            }
            withdrawalType = 'trading_account';
            paymentMethodName = "تحويل داخلي";
            finalDetails = { 
                type: 'trading_account',
                broker: account.broker, 
                accountNumber: account.accountNumber 
            };
        } else {
            if (!selectedMethod) {
                toast({ variant: 'destructive', title: 'خطأ', description: 'طريقة الدفع المحددة غير صالحة.' });
                return;
            }
            
            withdrawalType = 'crypto';
            paymentMethodName = selectedMethod.name;
            
            const methodFields = selectedMethod.fields || [];
            finalDetails = { 
                type: 'crypto',
                methodId: selectedMethod.id,
                methodName: selectedMethod.name,
            };
            
            methodFields.forEach(field => {
                finalDetails[field.name] = values.details[field.name] || '';
            });

            if (methodFields.length > 0) {
                const detailsToValidate: Record<string, string> = {};
                methodFields.forEach(field => {
                    detailsToValidate[field.name] = values.details[field.name] || '';
                });

                const detailsSchema = z.object(
                    methodFields.reduce((acc, field) => {
                        let fieldValidation: z.ZodString | z.ZodAny = z.string();
                        if (field.validation?.required) {
                            fieldValidation = fieldValidation.min(1, `${field.label} مطلوب.`);
                        }
                        if (field.validation?.minLength) {
                            fieldValidation = fieldValidation.min(field.validation.minLength, `${field.label} يجب أن يكون على الأقل ${field.validation.minLength} حرفًا.`);
                        }
                        if (field.validation?.regex) {
                            try {
                                const regex = new RegExp(field.validation.regex);
                                fieldValidation = fieldValidation.regex(regex, field.validation.regexErrorMessage || `تنسيق ${field.label} غير صالح`);
                            } catch (e) {
                                console.error("Invalid regex in payment method config:", e);
                            }
                        }
                        acc[field.name] = fieldValidation;
                        return acc;
                    }, {} as Record<string, z.ZodString | z.ZodAny>)
                );

                const detailsValidationResult = detailsSchema.safeParse(detailsToValidate);
                if (!detailsValidationResult.success) {
                    detailsValidationResult.error.errors.forEach(err => {
                        form.setError(`details.${err.path[0]}`, { type: 'manual', message: err.message });
                    });
                    return;
                }
            }
        }
        
        if (values.amount <= 0) {
            form.setError("amount", { type: "manual", message: "يجب أن يكون المبلغ أكبر من صفر."});
            return;
        }
        
        if (values.amount > availableBalance) {
            form.setError("amount", { type: "manual", message: "مبلغ السحب لا يمكن أن يتجاوز الرصيد المتاح."});
            return;
        }

        setIsLoading(true);
        
        const payload: Omit<Withdrawal, 'id' | 'requestedAt' | 'userId'> = {
            amount: values.amount,
            status: 'Processing',
            paymentMethod: paymentMethodName,
            withdrawalDetails: finalDetails,
        };

        try {
            const result = await requestWithdrawal(payload);
            if (!result.success) {
                throw new Error(result.message);
            }
            
            toast({ title: 'تم بنجاح!', description: 'تم تقديم طلب السحب الخاص بك.' });
            form.reset(formDefaultValues);
            fetchData();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'حدثت مشكلة أثناء تقديم طلبك.';
            console.error('Error submitting withdrawal: ', error);
            toast({ variant: 'destructive', title: 'خطأ', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: 'تم النسخ!', description: 'تم نسخ TXID إلى الحافظة.' });
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    }

     const getStatusText = (status: string) => {
        switch (status) {
            case 'Completed': return 'مكتمل';
            case 'Processing': return 'قيد المعالجة';
            case 'Failed': return 'فشل';
            default: return status;
        }
    }

    if (isFetching) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="p-4 text-right">
                    <CardTitle className="text-2xl">${availableBalance.toFixed(2)}</CardTitle>
                    <CardDescription className="text-xs">متاح للسحب</CardDescription>
                </CardHeader>
            </Card>
            
            <Card>
                <CardHeader className="p-4 text-right">
                    <CardTitle className="text-base">سحب جديد</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <Form {...form}>
                        <form key={JSON.stringify(formDefaultValues)} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="withdrawalType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-right w-full block">نوع السحب</FormLabel>
                                        <Select onValueChange={(value) => {
                                            field.onChange(value);
                                            form.setValue('paymentMethodId', undefined);
                                            form.setValue('tradingAccountId', undefined);
                                        }} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><div className="relative w-full text-right flex items-center"><Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><div className="pr-10"><SelectValue/></div></div></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="payment_method">عملات مشفرة</SelectItem>
                                                <SelectItem value="trading_account">حساب تداول</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {withdrawalType === 'payment_method' && (
                                <FormField
                                    control={form.control}
                                    name="paymentMethodId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-right w-full block">طريقة السحب</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                 <FormControl><SelectTrigger><div className="relative w-full text-right flex items-center"><Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><div className="pr-10"><SelectValue placeholder="اختر طريقة" /></div></div></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {cryptoPaymentMethods.map(method => (
                                                        <SelectItem key={method.id} value={method.id}>
                                                            {method.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            {withdrawalType === 'trading_account' && (
                                 <FormField
                                    control={form.control}
                                    name="tradingAccountId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-right w-full block">حساب التداول</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><div className="relative w-full text-right flex items-center"><Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><div className="pr-10"><SelectValue placeholder="اختر حساب" /></div></div></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {userTradingAccounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.broker} - {acc.accountNumber}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}


                            {withdrawalType === 'payment_method' && selectedMethod && selectedMethod.fields.map(customField => {
                                 const fieldName = `details.${customField.name}` as const;
                                 return (
                                     <FormField
                                         key={customField.name}
                                         control={form.control}
                                         name={fieldName}
                                         render={({ field }) => (
                                             <FormItem>
                                                 <FormLabel className="text-right w-full block">{customField.label}</FormLabel>
                                                 <FormControl>
                                                    <div className="relative">
                                                        <Wallet className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input 
                                                            type={customField.type} 
                                                            placeholder={customField.placeholder} 
                                                            {...field}
                                                            className="pr-10 text-right"
                                                        />
                                                    </div>
                                                 </FormControl>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />
                                 )
                            })}
                            
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-right w-full block">المبلغ (بالدولار الأمريكي)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Banknote className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                                <Input type="number" placeholder="0.00" {...field} className="pr-10 text-right" />
                                                <Button type="button" variant="ghost" size="sm" className="absolute left-1 top-1/2 -translate-y-1/2 h-auto py-0.5 px-2" onClick={() => form.setValue('amount', availableBalance)}>الحد الأقصى</Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                تقديم الطلب
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            

            <Card>
                <CardHeader className="p-4 text-right">
                    <CardTitle className="text-base flex items-center gap-2 justify-end">
                        <History className="h-4 w-4 text-muted-foreground" />
                        السحوبات الأخيرة
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right text-xs">التاريخ</TableHead>
                                <TableHead className="text-right text-xs">المبلغ</TableHead>
                                <TableHead className="text-right text-xs">الحالة / TXID</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {recentWithdrawals.length > 0 ? (
                                recentWithdrawals.slice(0, 2).map((w) => (
                                <TableRow key={w.id} onClick={() => router.push(`/dashboard/withdraw/${w.id}`)} className="cursor-pointer">
                                    <TableCell className="text-muted-foreground text-xs">{format(new Date(w.requestedAt), "PP")}</TableCell>
                                    <TableCell className="font-medium text-xs">${w.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-1">
                                            <Badge variant={getStatusVariant(w.status)}>{getStatusText(w.status)}</Badge>
                                            {w.txId && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(w.txId!) }}
                                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Copy className="h-3 w-3 ml-2" />
                                                                <span className="truncate max-w-[100px] font-mono">{w.txId}</span>
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>نسخ TXID</p></TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                             {w.status === 'Failed' && w.rejectionReason && (
                                                <div className="flex items-start gap-1.5 text-xs text-destructive pt-1">
                                                    <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                                                    <p>{w.rejectionReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                ))
                             ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24 text-xs">لا يوجد سجل سحوبات.</TableCell>
                                </TableRow>
                             )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
                <CardFooter className="p-2 border-t">
                    <Button asChild variant="ghost" size="sm" className="w-full justify-center text-xs">
                        <Link href="/dashboard/wallet/history"><ChevronLeft className="mr-1 h-4 w-4" /> عرض كل السجل </Link>
                    </Button>
                </CardFooter>
            </Card>

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm">هام</AlertTitle>
                <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>تتم معالجة عمليات السحب في غضون 24 ساعة.</li>
                        <li>تأكد من صحة المعلومات المقدمة.</li>
                        <li>لا يمكن استرداد الأموال المرسلة إلى وجهة خاطئة.</li>
                    </ul>
                </AlertDescription>
            </Alert>
        </div>
    );
}

function DepositTabContent() {
    return (
        <Card>
            <CardHeader className="p-4 text-right">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                    <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                    إيداع الأموال
                </CardTitle>
                 <CardDescription className="text-xs">
                    وظيفة الإيداع ستكون متاحة قريباً.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-sm text-muted-foreground py-10">
                    يرجى التحقق مرة أخرى لاحقًا للحصول على خيارات الإيداع.
                </p>
            </CardContent>
            <CardHeader className="p-4 border-t text-right">
                <CardTitle className="text-base flex items-center gap-2 justify-end">
                    <History className="h-4 w-4 text-muted-foreground" />
                    الإيداعات الأخيرة
                </CardTitle>
            </CardHeader>
             <CardContent className="p-0">
                 <p className="text-center text-sm text-muted-foreground py-10 px-4">
                    لا يوجد سجل إيداعات متاح.
                </p>
            </CardContent>
             <CardFooter className="p-2 border-t">
                <Button asChild variant="ghost" size="sm" className="w-full justify-center text-xs">
                    <Link href="/dashboard/wallet/history"><ChevronLeft className="mr-1 h-4 w-4" /> عرض كل السجل </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function WalletPage() {
    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <PageHeader
                title="المحفظة"
                description="إدارة عمليات الإيداع والسحب الخاصة بك."
            />
            <Tabs defaultValue="withdraw" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposit">إيداع</TabsTrigger>
                    <TabsTrigger value="withdraw">سحب</TabsTrigger>
                </TabsList>
                <TabsContent value="deposit" className="mt-4">
                    <DepositTabContent />
                </TabsContent>
                <TabsContent value="withdraw" className="mt-4">
                    <WithdrawTabContent />
                </TabsContent>
            </Tabs>
        </div>
    )
}

    