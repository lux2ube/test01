"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { approveWithdrawal, getWithdrawals, rejectWithdrawal } from './actions';
import { getUsers } from '../users/actions';
import type { Withdrawal, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, Hash, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
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
import { AlertTriangle, Copy } from 'lucide-react';

type EnrichedWithdrawal = Withdrawal & { userProfile?: UserProfile };

function RejectDialog({ withdrawalIds, onSuccess, onClose }: { withdrawalIds: string[]; onSuccess: () => void; onClose: () => void; }) {
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'سبب الرفض لا يمكن أن يكون فارغاً.' });
            return;
        }
        setIsSubmitting(true);

        const results = await Promise.all(
            withdrawalIds.map(id => rejectWithdrawal(id, reason))
        );

        const successfulCount = results.filter(r => r.success).length;
        if (successfulCount > 0) {
            toast({ title: 'نجاح', description: `تم رفض ${successfulCount} طلبات.` });
            onSuccess();
        }
        if (results.length - successfulCount > 0) {
             toast({ variant: 'destructive', title: 'فشل', description: `فشل رفض ${results.length - successfulCount} طلبات.` });
        }
        
        setIsSubmitting(false);
        onClose();
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>رفض طلبات السحب</AlertDialogTitle>
                <AlertDialogDescription>
                    سيتم رفض {withdrawalIds.length} طلبات سحب. يرجى تقديم سبب.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
                <Label htmlFor="reason">سبب الرفض</Label>
                <div className="relative">
                    <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                        id="reason" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="مثال: نشاط تداول غير كافٍ."
                        className="pr-10"
                    />
                </div>
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onClose}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تأكيد الرفض
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    )
}

function SubRow({ row }: { row: Row<EnrichedWithdrawal> }) {
  const withdrawal = row.original;
  const detailsChanged = withdrawal.previousWithdrawalDetails && JSON.stringify(withdrawal.withdrawalDetails) !== JSON.stringify(withdrawal.previousWithdrawalDetails);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  return (
    <div className="p-4 space-y-4 bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-base">تفاصيل السحب</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {Object.entries(withdrawal.withdrawalDetails).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className={`font-mono ${detailsChanged ? 'text-destructive' : ''}`}>{String(value)}</span>
                        </div>
                    ))}
                    {withdrawal.txId && (
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">TXID:</span>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(withdrawal.txId!)} className="font-mono text-xs h-auto p-1">
                                <Copy className="w-3 h-3 ml-2" />
                                {withdrawal.txId.substring(0, 10)}...
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            {detailsChanged && (
                 <Card className="border-destructive">
                    <CardHeader className="text-destructive"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle /> تم تغيير التفاصيل</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="font-semibold">التفاصيل السابقة:</p>
                        {withdrawal.previousWithdrawalDetails && Object.entries(withdrawal.previousWithdrawalDetails).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono">{String(value)}</span>
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
    const [isLoading, setIsLoading] = useState(true);
    const [dialogState, setDialogState] = useState<{
        type: 'approve' | 'reject' | null;
        withdrawalIds: string[];
    }>({ type: null, withdrawalIds: [] });
    const [dialogInputValue, setDialogInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [data, usersData] = await Promise.all([
                getWithdrawals(),
                getUsers()
            ]);
            
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
            <PageHeader title="إدارة السحوبات" description="معالجة طلبات السحب من المستخدمين." />
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogState.type === 'approve' ? 'الموافقة على السحب' : 'رفض طلب السحب'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogState.type === 'approve'
                                ? `أدخل معرف معاملة البلوك تشين (TXID) للموافقة على السحب المحدد.`
                                : `يرجى تقديم سبب لرفض ${dialogState.withdrawalIds.length} طلبات سحب محددة.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="dialog-input">
                            {dialogState.type === 'approve' ? 'معرف المعاملة / المرجع' : 'سبب الرفض'}
                        </Label>
                        <div className="relative">
                           {dialogState.type === 'approve' ? <Hash className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> : <MessageSquare className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />}
                            {dialogState.type === 'approve' ? (
                                <Input id="dialog-input" value={dialogInputValue} onChange={(e) => setDialogInputValue(e.target.value)} placeholder="0x..." className="pr-10" />
                            ) : (
                                <Textarea id="dialog-input" value={dialogInputValue} onChange={(e) => setDialogInputValue(e.target.value)} placeholder="مثال: نشاط تداول غير كافٍ." className="pr-10" />
                            )}
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
