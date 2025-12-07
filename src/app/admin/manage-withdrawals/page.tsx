"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { approveWithdrawal, getWithdrawals, rejectWithdrawal, createAdminBalanceAdjustment } from './actions';
import { getUsers } from '../users/actions';
import type { Withdrawal, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Hash, MessageSquare, CheckCircle, XCircle, Check, MinusCircle, Search, DollarSign, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { Row, FilterFn } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Copy, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type EnrichedWithdrawal = Withdrawal & { userProfile?: UserProfile };

const COMMON_REJECTION_REASONS = [
    { label: 'عنوان جديد - تواصل مع الدعم', value: 'هذا عنوان سحب جديد. يرجى التواصل مع فريق الدعم للموافقة على هذا العنوان قبل إتمام عملية السحب.' },
    { label: 'نشاط تداول غير كافٍ', value: 'نشاط التداول غير كافٍ لمعالجة هذا السحب. يرجى مواصلة التداول والمحاولة لاحقاً.' },
    { label: 'معلومات الدفع غير صحيحة', value: 'معلومات الدفع المقدمة غير صحيحة أو غير مكتملة. يرجى التحقق من البيانات وإعادة الطلب.' },
    { label: 'الحساب غير موثق', value: 'حسابك غير موثق بالكامل. يرجى إكمال عملية التحقق من الهوية أولاً.' },
    { label: 'تجاوز الحد اليومي', value: 'تم تجاوز الحد اليومي للسحب. يرجى المحاولة مرة أخرى غداً.' },
    { label: 'الرصيد غير كافٍ', value: 'الرصيد المتاح غير كافٍ لإتمام هذا السحب.' },
    { label: 'نشاط مشبوه', value: 'تم اكتشاف نشاط غير عادي في حسابك. تم إيقاف السحب مؤقتاً للمراجعة الأمنية.' },
    { label: 'عنوان المحفظة غير صالح', value: 'عنوان المحفظة المقدم غير صالح أو لا يتطابق مع الشبكة المحددة.' },
    { label: 'طلب مكرر', value: 'يوجد طلب سحب مماثل قيد المعالجة. يرجى انتظار اكتماله قبل تقديم طلب جديد.' },
];

function formatDetailValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            toast({ title: 'تم النسخ', description: label ? `تم نسخ ${label}` : 'تم النسخ إلى الحافظة' });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل النسخ' });
        }
    };

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopy}
            className="h-6 w-6 p-0 hover:bg-primary/10"
        >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </Button>
    );
}

function SubRow({ row }: { row: Row<EnrichedWithdrawal> }) {
  const withdrawal = row.original;
  const { toast } = useToast();
  const detailsChanged = withdrawal.previousWithdrawalDetails && JSON.stringify(withdrawal.withdrawalDetails) !== JSON.stringify(withdrawal.previousWithdrawalDetails);
  
  const copyAllDetails = async () => {
    const detailsText = Object.entries(withdrawal.withdrawalDetails || {})
        .filter(([, value]) => formatDetailValue(value) !== '')
        .map(([key, value]) => `${key}: ${formatDetailValue(value)}`)
        .join('\n');
    if (!detailsText) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'لا توجد تفاصيل للنسخ' });
        return;
    }
    try {
        await navigator.clipboard.writeText(detailsText);
        toast({ title: 'تم النسخ', description: 'تم نسخ جميع التفاصيل' });
    } catch {
        toast({ variant: 'destructive', title: 'خطأ', description: 'فشل النسخ' });
    }
  };
  
  return (
    <div className="p-4 space-y-4 bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">تفاصيل السحب</CardTitle>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={copyAllDetails}
                            className="h-7 text-xs"
                        >
                            <ClipboardList className="w-3 h-3 ml-1" />
                            نسخ الكل
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                    {Object.entries(withdrawal.withdrawalDetails || {})
                        .filter(([, value]) => formatDetailValue(value) !== '')
                        .map(([key, value]) => {
                            const formattedValue = formatDetailValue(value);
                            return (
                                <div key={key} className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted">
                                    <span className="text-muted-foreground text-xs">{key}:</span>
                                    <div className="flex items-center gap-1">
                                        <span className={`font-mono text-xs ${detailsChanged ? 'text-destructive' : ''}`}>
                                            {formattedValue.length > 30 ? `${formattedValue.substring(0, 30)}...` : formattedValue}
                                        </span>
                                        <CopyButton text={formattedValue} label={key} />
                                    </div>
                                </div>
                            );
                        })}
                    {withdrawal.txId && (
                         <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted border-t mt-2 pt-2">
                            <span className="text-muted-foreground text-xs">TXID:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">
                                    {withdrawal.txId.substring(0, 20)}...
                                </span>
                                <CopyButton text={withdrawal.txId} label="TXID" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {!withdrawal.isWhitelisted && withdrawal.status === 'Processing' && (
                 <Card className="border-amber-500">
                    <CardHeader className="text-amber-600"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle /> عنوان جديد</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p>هذا العنوان غير مسجل في القائمة البيضاء للمستخدم.</p>
                        <p className="text-muted-foreground">عند الموافقة، سيتم إضافة العنوان تلقائياً للقائمة البيضاء.</p>
                    </CardContent>
                </Card>
            )}
            {detailsChanged && (
                 <Card className="border-destructive">
                    <CardHeader className="text-destructive"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle /> تم تغيير التفاصيل</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold">التفاصيل السابقة:</p>
                        {withdrawal.previousWithdrawalDetails && Object.entries(withdrawal.previousWithdrawalDetails)
                            .filter(([, value]) => formatDetailValue(value) !== '')
                            .map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-mono">{formatDetailValue(value)}</span>
                                </div>
                            ))}
                    </CardContent>
                </Card>
            )}
            {withdrawal.status === 'Failed' && withdrawal.rejectionReason && (
                <Card className="border-destructive md:col-span-2">
                    <CardHeader className="text-destructive"><CardTitle className="text-base">سبب الرفض</CardTitle></CardHeader>
                    <CardContent><p>{withdrawal.rejectionReason}</p></CardContent>
                </Card>
            )}
        </div>
    </div>
  )
}

export default function ManageWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<EnrichedWithdrawal[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogState, setDialogState] = useState<{
        type: 'approve' | 'reject' | null;
        withdrawalIds: string[];
    }>({ type: null, withdrawalIds: [] });
    const [dialogInputValue, setDialogInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState<{
        userId: string;
        amount: string;
        reason: string;
        userSearch: string;
    }>({ userId: '', amount: '', reason: '', userSearch: '' });
    const [isAdjusting, setIsAdjusting] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                getWithdrawals(),
                getUsers()
            ]);
            
            setAllUsers(usersData);
            const usersMap = new Map(usersData.map(u => [u.id, u]));
            
            const enrichedData = data.map(w => ({
                ...w,
                userProfile: usersMap.get(w.userId)
            }));

            setWithdrawals(enrichedData);
        } catch (error) {
            console.error("Failed to fetch withdrawals:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب طلبات السحب.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    const filteredUsers = useMemo(() => {
        if (!adjustmentData.userSearch.trim()) return [];
        const search = adjustmentData.userSearch.toLowerCase();
        return allUsers.filter(u => 
            u.name?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u.clientId?.toString().includes(search)
        ).slice(0, 10);
    }, [allUsers, adjustmentData.userSearch]);

    const selectedUser = useMemo(() => {
        return allUsers.find(u => u.id === adjustmentData.userId);
    }, [allUsers, adjustmentData.userId]);

    const handleAdjustmentSubmit = async () => {
        const amount = parseFloat(adjustmentData.amount);
        if (!adjustmentData.userId) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى اختيار مستخدم' });
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال مبلغ صحيح' });
            return;
        }
        if (!adjustmentData.reason.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'يرجى إدخال سبب التعديل' });
            return;
        }

        setIsAdjusting(true);
        try {
            const result = await createAdminBalanceAdjustment(
                adjustmentData.userId,
                amount,
                adjustmentData.reason
            );

            if (result.success) {
                toast({ title: 'نجاح', description: result.message });
                setAdjustmentDialogOpen(false);
                setAdjustmentData({ userId: '', amount: '', reason: '', userSearch: '' });
                fetchData();
            } else {
                toast({ variant: 'destructive', title: 'خطأ', description: result.message });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ غير متوقع' });
        } finally {
            setIsAdjusting(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const openDialog = (type: 'approve' | 'reject', selectedRows: Row<EnrichedWithdrawal>[]) => {
        const ids = selectedRows.map(row => row.original.id);
        setDialogState({ type, withdrawalIds: ids });
        setDialogInputValue('');
    };

    const closeDialog = () => {
        setDialogState({ type: null, withdrawalIds: [] });
        setDialogInputValue('');
    };

    const handleDialogSubmit = async () => {
        if (!dialogState.type || dialogState.withdrawalIds.length === 0) return;

        if (dialogState.type === 'approve' && dialogState.withdrawalIds.length > 1) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن الموافقة على سحوبات متعددة بمعرف معاملة واحد.' });
            return;
        }

        if (!dialogInputValue.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'الحقل لا يمكن أن يكون فارغاً.' });
            return;
        }

        setIsSubmitting(true);
        const results = await Promise.all(
            dialogState.withdrawalIds.map(id => 
                dialogState.type === 'approve'
                    ? approveWithdrawal(id, dialogInputValue)
                    : rejectWithdrawal(id, dialogInputValue)
            )
        );

        const successfulCount = results.filter(r => r.success).length;
        if (successfulCount > 0) {
            toast({ title: 'نجاح', description: `تم تحديث ${successfulCount} طلبات بنجاح.` });
            fetchData();
        }
        if (results.length - successfulCount > 0) {
            toast({ variant: 'destructive', title: 'فشل', description: `فشل تحديث ${results.length - successfulCount} طلبات.` });
        }
        
        setIsSubmitting(false);
        closeDialog();
    };
    
    if(isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader title="إدارة السحوبات" description="معالجة طلبات السحب من المستخدمين." />
                <Button 
                    variant="outline" 
                    onClick={() => setAdjustmentDialogOpen(true)}
                    className="gap-2"
                >
                    <MinusCircle className="h-4 w-4 text-destructive" />
                    تعديل رصيد (خصم)
                </Button>
            </div>
            <DataTable 
                columns={columns} 
                data={withdrawals} 
                globalFilterFn={globalFilterFn}
                searchPlaceholder='بحث حسب المستخدم, المبلغ, TXID...'
                filterableColumns={[
                    {
                      id: 'status',
                      title: 'الحالة',
                      options: [
                        { value: 'Processing', label: 'قيد المعالجة' },
                        { value: 'Completed', label: 'مكتمل' },
                        { value: 'Failed', label: 'فشل' },
                      ],
                    },
                ]}
                renderSubComponent={({ row }) => <SubRow row={row} />}
                getRowCanExpand={() => true}
            >
                {(table) => {
                    const selectedRows = table.getFilteredSelectedRowModel().rows;
                    const canProcess = selectedRows.some(row => row.original.status === 'Processing');
                    const canApproveSingle = canProcess && selectedRows.length === 1;

                    return (
                        <div className="flex items-center gap-2">
                             <Button
                                size="sm"
                                variant="outline"
                                disabled={!canApproveSingle}
                                onClick={() => openDialog('approve', selectedRows)}
                                className="h-8"
                            >
                                <CheckCircle className="ml-2 h-4 w-4 text-green-500"/>
                                موافقة
                            </Button>
                             <Button
                                size="sm"
                                variant="destructive"
                                disabled={!canProcess}
                                onClick={() => openDialog('reject', selectedRows)}
                                className="h-8"
                            >
                                <XCircle className="ml-2 h-4 w-4"/>
                                رفض
                            </Button>
                        </div>
                    )
                }}
            </DataTable>

            <AlertDialog open={!!dialogState.type} onOpenChange={(open) => !open && closeDialog()}>
                <AlertDialogContent className={dialogState.type === 'reject' ? 'max-w-2xl' : ''}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogState.type === 'approve' ? 'الموافقة على السحب' : 'رفض طلب السحب'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogState.type === 'approve'
                                ? `أدخل معرف معاملة البلوك تشين (TXID) للموافقة على السحب المحدد.`
                                : `يرجى تقديم سبب لرفض ${dialogState.withdrawalIds.length} طلبات سحب محددة.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        {dialogState.type === 'reject' && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">أسباب شائعة (اضغط للاختيار)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_REJECTION_REASONS.map((reason, idx) => (
                                        <Badge 
                                            key={idx}
                                            variant={dialogInputValue === reason.value ? "default" : "outline"}
                                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                                            onClick={() => setDialogInputValue(reason.value)}
                                        >
                                            {reason.label}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="dialog-input">
                                {dialogState.type === 'approve' ? 'معرف المعاملة / المرجع' : 'سبب الرفض'}
                            </Label>
                            <div className="relative">
                               {dialogState.type === 'approve' ? <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> : <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />}
                                {dialogState.type === 'approve' ? (
                                    <Input id="dialog-input" value={dialogInputValue} onChange={(e) => setDialogInputValue(e.target.value)} placeholder="0x..." className="pr-10" />
                                ) : (
                                    <Textarea 
                                        id="dialog-input" 
                                        value={dialogInputValue} 
                                        onChange={(e) => setDialogInputValue(e.target.value)} 
                                        placeholder="اكتب سبب الرفض أو اختر من الأسباب الشائعة أعلاه..." 
                                        className="pr-10 min-h-[100px]"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={closeDialog}>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDialogSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            {dialogState.type === 'approve' ? 'الموافقة' : 'تأكيد الرفض'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
                <AlertDialogContent className="max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <MinusCircle className="h-5 w-5 text-destructive" />
                            تعديل رصيد المستخدم (خصم)
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            خصم مبلغ من رصيد المستخدم لتصحيح الأخطاء. سيتم تسجيل هذا التعديل في سجلات السحب.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>اختر المستخدم</Label>
                            {selectedUser ? (
                                <Card className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium text-sm">{selectedUser.name}</p>
                                                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setAdjustmentData(prev => ({ ...prev, userId: '', userSearch: '' }))}
                                        >
                                            تغيير
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="ابحث بالاسم أو البريد أو رقم العميل..."
                                            value={adjustmentData.userSearch}
                                            onChange={(e) => setAdjustmentData(prev => ({ ...prev, userSearch: e.target.value }))}
                                            className="pr-10"
                                        />
                                    </div>
                                    {filteredUsers.length > 0 && (
                                        <Card className="max-h-48 overflow-y-auto">
                                            {filteredUsers.map(user => (
                                                <div 
                                                    key={user.id}
                                                    className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                                                    onClick={() => setAdjustmentData(prev => ({ 
                                                        ...prev, 
                                                        userId: user.id, 
                                                        userSearch: '' 
                                                    }))}
                                                >
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email} | #{user.clientId}</p>
                                                </div>
                                            ))}
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adjustment-amount">المبلغ المراد خصمه</Label>
                            <div className="relative">
                                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="adjustment-amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={adjustmentData.amount}
                                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                                    className="pr-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adjustment-reason">سبب التعديل</Label>
                            <Textarea
                                id="adjustment-reason"
                                placeholder="اكتب سبب الخصم بالتفصيل..."
                                value={adjustmentData.reason}
                                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setAdjustmentDialogOpen(false);
                            setAdjustmentData({ userId: '', amount: '', reason: '', userSearch: '' });
                        }}>
                            إلغاء
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleAdjustmentSubmit} 
                            disabled={isAdjusting || !adjustmentData.userId || !adjustmentData.amount || !adjustmentData.reason}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isAdjusting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تأكيد الخصم
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

const globalFilterFn: FilterFn<EnrichedWithdrawal> = (row, columnId, value, addMeta) => {
    const lowercasedValue = value.toLowerCase();
    const { userProfile, amount, txId, rejectionReason, paymentMethod } = row.original;
    
    const searchableText = [
        userProfile?.name,
        userProfile?.email,
        userProfile?.clientId?.toString(),
        amount.toString(),
        txId,
        rejectionReason,
        paymentMethod,
    ].filter(Boolean).join(' ').toLowerCase();

    return searchableText.includes(lowercasedValue);
};
