"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/useAuthContext";
import { getWalletHistory } from "../actions";
import type { Withdrawal } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function WithdrawalsList({ withdrawals, isLoading }: { withdrawals: Withdrawal[], isLoading: boolean }) {
    const router = useRouter();

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Completed': return 'default';
            case 'Processing': return 'secondary';
            case 'Failed': return 'destructive';
            default: return 'outline';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Completed': return 'مكتمل';
            case 'Processing': return 'قيد المعالجة';
            case 'Failed': return 'فشل';
            default: return status;
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <Card>
            <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right text-xs">التاريخ</TableHead>
                                <TableHead className="text-right text-xs">المبلغ</TableHead>
                                <TableHead className="text-left text-xs">الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {withdrawals.length > 0 ? (
                                withdrawals.map((w) => (
                                    <TableRow key={w.id} onClick={() => router.push(`/dashboard/withdraw/${w.id}`)} className="cursor-pointer">
                                        <TableCell className="text-xs">{format(new Date(w.requestedAt), "PP")}</TableCell>
                                        <TableCell className="font-medium text-xs">${w.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-left">
                                            <Badge variant={getStatusVariant(w.status)}>{getStatusText(w.status)}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">لا يوجد سجل سحوبات.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}


export default function WalletHistoryPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getWalletHistory().then(history => {
                setWithdrawals(history.withdrawals);
                setIsLoading(false);
            });
        }
    }, [user]);

    return (
        <div className="max-w-md mx-auto w-full px-4 py-4 space-y-4">
             <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى المحفظة
            </Button>
            
            <PageHeader title="سجل المحفظة" description="سجل الإيداعات والسحوبات الكامل الخاص بك." />

            <Tabs defaultValue="withdrawals" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="deposits">الإيداعات</TabsTrigger>
                    <TabsTrigger value="withdrawals">السحوبات</TabsTrigger>
                </TabsList>
                <TabsContent value="deposits" className="mt-4">
                     <Card>
                        <CardContent className="p-10 text-center">
                            <p className="text-muted-foreground text-sm">لا يوجد سجل إيداعات حتى الآن.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="withdrawals" className="mt-4">
                   <WithdrawalsList withdrawals={withdrawals} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
