
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { updateTradingAccountStatus, getTradingAccounts } from './actions';
import { getBrokers } from '../manage-brokers/actions';
import { getUsers } from '../users/actions';
import type { TradingAccount, Broker, UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { FilterFn, Row } from '@tanstack/react-table';

type EnrichedAccount = TradingAccount & { userProfile?: UserProfile };

function RejectAccountDialog({ accountIds, onSuccess, onClose }: { accountIds: string[]; onSuccess: () => void; onClose: () => void; }) {
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
            accountIds.map(id => updateTradingAccountStatus(id, 'Rejected', reason))
        );

        const successfulCount = results.filter(r => r.success).length;
        const failedCount = results.length - successfulCount;

        if (successfulCount > 0) {
            toast({ title: 'نجاح', description: `تم رفض ${successfulCount} حسابات.` });
            onSuccess();
        }
        if (failedCount > 0) {
             toast({ variant: 'destructive', title: 'خطأ', description: `فشل رفض ${failedCount} حسابات.` });
        }
        
        setIsSubmitting(false);
        onClose();
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>رفض حسابات التداول</AlertDialogTitle>
                <AlertDialogDescription>
                    سيتم رفض {accountIds.length} حسابات. يرجى تقديم سبب.
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
                        placeholder="مثال: رقم الحساب لا يتطابق مع سجلاتنا."
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


export default function ManageAccountsPage() {
    const [accounts, setAccounts] = useState<EnrichedAccount[]>([]);
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dialogState, setDialogState] = useState<{ isOpen: boolean, accountIds: string[] }>({ isOpen: false, accountIds: [] });
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [fetchedAccounts, fetchedBrokers, fetchedUsers] = await Promise.all([
                getTradingAccounts(),
                getBrokers(),
                getUsers()
            ]);

            const usersMap = new Map(fetchedUsers.map(u => [u.id, u]));

            const enrichedAccounts = fetchedAccounts.map(acc => ({
                ...acc,
                userProfile: usersMap.get(acc.userId)
            }));
            
            enrichedAccounts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setAccounts(enrichedAccounts);
            setBrokers(fetchedBrokers);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب البيانات.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (selectedRows: Row<EnrichedAccount>[]) => {
        const accountIds = selectedRows.map(row => row.original.id);
        const results = await Promise.all(
            accountIds.map(id => updateTradingAccountStatus(id, 'Approved'))
        );
        const successfulCount = results.filter(r => r.success).length;
        const failedCount = results.length - successfulCount;

        if (successfulCount > 0) {
            toast({ title: 'نجاح', description: `تمت الموافقة على ${successfulCount} حسابات.` });
            fetchData();
        }
        if (failedCount > 0) {
             toast({ variant: 'destructive', title: 'خطأ', description: `فشلت الموافقة على ${failedCount} حسابات.` });
        }
    };
    
    const handleReject = (selectedRows: Row<EnrichedAccount>[]) => {
        const accountIds = selectedRows.map(row => row.original.id);
        setDialogState({ isOpen: true, accountIds: accountIds });
    };
    
    const globalFilterFn: FilterFn<EnrichedAccount> = (row, columnId, value, addMeta) => {
        const lowercasedValue = value.toLowerCase();
        const { userProfile, accountNumber, broker } = row.original;
        
        const searchableText = [
            userProfile?.name,
            userProfile?.email,
            userProfile?.clientId?.toString(),
            accountNumber,
            broker,
        ].join(' ').toLowerCase();

        return searchableText.includes(lowercasedValue);
    };

    const brokerFilterOptions = useMemo(() => {
        return brokers.map(broker => ({
            value: broker.name,
            label: broker.name,
        }));
    }, [brokers]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="إدارة حسابات التداول" description="الموافقة على أو رفض حسابات التداول المقدمة من المستخدمين." />
            <DataTable 
                columns={columns} 
                data={accounts} 
                globalFilterFn={globalFilterFn}
                searchPlaceholder="بحث حسب المستخدم, الوسيط, الحساب..."
                filterableColumns={[
                    {
                        id: 'status',
                        title: 'الحالة',
                        options: [
                            { value: 'Pending', label: 'معلق' },
                            { value: 'Approved', label: 'مقبول' },
                            { value: 'Rejected', label: 'مرفوض' },
                        ]
                    },
                    {
                        id: 'broker',
                        title: 'الوسيط',
                        options: brokerFilterOptions,
                    }
                ]}
            >
                {(table) => {
                    const selectedRows = table.getFilteredSelectedRowModel().rows;
                    const canApprove = selectedRows.some(row => row.original.status === 'Pending');
                    const canReject = selectedRows.some(row => row.original.status === 'Pending');
                    
                    return (
                        <div className="flex items-center gap-2">
                             <Button
                                size="sm"
                                variant="outline"
                                disabled={!canApprove}
                                onClick={() => handleApprove(selectedRows)}
                                className="h-8"
                            >
                                <CheckCircle className="ml-2 h-4 w-4 text-green-500"/>
                                موافقة
                            </Button>
                             <Button
                                size="sm"
                                variant="destructive"
                                disabled={!canReject}
                                onClick={() => handleReject(selectedRows)}
                                className="h-8"
                            >
                                <XCircle className="ml-2 h-4 w-4"/>
                                رفض
                            </Button>
                        </div>
                    )
                }}
            </DataTable>
            <AlertDialog open={dialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setDialogState({isOpen: false, accountIds: []})}>
                {dialogState.accountIds.length > 0 && (
                    <RejectAccountDialog 
                        accountIds={dialogState.accountIds}
                        onSuccess={fetchData} 
                        onClose={() => setDialogState({isOpen: false, accountIds: []})}
                    />
                )}
            </AlertDialog>
        </div>
    );
}
