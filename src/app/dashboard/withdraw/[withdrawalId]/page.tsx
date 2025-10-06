
"use client";

import { useEffect, useState } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import { useAuthContext } from "@/hooks/useAuthContext";
import { createClient } from "@/lib/supabase/client";
import type { Withdrawal } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Calendar, Hash, ReceiptText, Wallet, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium break-all">{value}</p>
            </div>
        </div>
    );
}

export default function WithdrawalDetailPage() {
    const { user } = useAuthContext();
    const params = useParams();
    const router = useRouter();
    const withdrawalId = params.withdrawalId as string;
    const [withdrawal, setWithdrawal] = useState<Withdrawal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWithdrawal = async () => {
            if (!user || !withdrawalId) {
                setIsLoading(false);
                return;
            }

            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('withdrawals')
                    .select('*')
                    .eq('id', withdrawalId)
                    .eq('user_id', user.id)
                    .single();

                if (error || !data) {
                    notFound();
                } else {
                    setWithdrawal({
                        id: data.id,
                        userId: data.user_id,
                        amount: data.amount,
                        paymentMethod: data.payment_method,
                        status: data.status,
                        requestedAt: new Date(data.requested_at),
                        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
                        withdrawalDetails: data.withdrawal_details,
                        txId: data.tx_id,
                        rejectionReason: data.rejection_reason,
                    } as Withdrawal);
                }
            } catch (error) {
                console.error("Error fetching withdrawal:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };

        fetchWithdrawal();
    }, [user, withdrawalId]);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[calc(100vh-theme(spacing.14))]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!withdrawal) {
        return notFound();
    }
    
    const formatDetailLabel = (label: string) => {
        const result = label.replace(/([A-Z])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    }

    return (
        <div className="max-w-[400px] mx-auto w-full px-4 py-4 space-y-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى السحوبات
            </Button>
            
            <PageHeader title="تفاصيل السحب" />

            <Card>
                <CardHeader className="p-4 flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl text-primary">${withdrawal.amount.toFixed(2)}</CardTitle>
                        <CardDescription>طلب سحب</CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(withdrawal.status)}>{getStatusText(withdrawal.status)}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <DetailRow icon={Calendar} label="تاريخ الطلب" value={format(withdrawal.requestedAt, 'PPp')} />
                    {withdrawal.completedAt && <DetailRow icon={Calendar} label="تاريخ الإكمال" value={format(withdrawal.completedAt, 'PPp')} />}
                    <DetailRow icon={Wallet} label="الطريقة" value={withdrawal.paymentMethod} />
                    <div className="space-y-3">
                         {Object.entries(withdrawal.withdrawalDetails).map(([key, value]) => (
                            <DetailRow key={key} icon={Hash} label={formatDetailLabel(key)} value={value} />
                         ))}
                    </div>
                    {withdrawal.txId && <DetailRow icon={ReceiptText} label="معرف المعاملة" value={withdrawal.txId} />}
                </CardContent>
                {withdrawal.rejectionReason && (
                    <CardFooter className="p-4 pt-0">
                         <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>سبب الرفض</AlertTitle>
                            <AlertDescription>{withdrawal.rejectionReason}</AlertDescription>
                        </Alert>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
