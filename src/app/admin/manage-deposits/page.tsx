"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAllDeposits, getDepositStats, type AdminDeposit } from "./actions";
import { createAdminDeposit } from "../manage-withdrawals/actions";
import { getUsers } from "../users/actions";
import type { UserProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ManageDepositsPage() {
    const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState({ totalDeposits: 0, totalAmount: 0, todayAmount: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
    const [depositData, setDepositData] = useState<{
        userId: string;
        amount: string;
        reason: string;
        userSearch: string;
    }>({ userId: '', amount: '', reason: '', userSearch: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [depositsResult, statsResult, usersData] = await Promise.all([
                getAllDeposits(),
                getDepositStats(),
                getUsers()
            ]);
            setDeposits(depositsResult.deposits);
            setStats(statsResult);
            setAllUsers(usersData);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب الإيداعات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!depositData.userSearch.trim()) return [];
        const search = depositData.userSearch.toLowerCase();
        return allUsers.filter(u => 
            u.name?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search) ||
            u.clientId?.toString().includes(search)
        ).slice(0, 10);
    }, [allUsers, depositData.userSearch]);

    const selectedUser = useMemo(() => {
        return allUsers.find(u => u.id === depositData.userId);
    }, [allUsers, depositData.userId]);

    const handleDeposit = async () => {
        if (!depositData.userId || !depositData.amount || !depositData.reason.trim()) {
            toast({ variant: "destructive", title: "خطأ", description: "جميع الحقول مطلوبة" });
            return;
        }

        const amount = parseFloat(depositData.amount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: "destructive", title: "خطأ", description: "المبلغ يجب أن يكون رقماً موجباً" });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await createAdminDeposit(depositData.userId, amount, depositData.reason);
            if (result.success) {
                toast({ title: "نجاح", description: result.message });
                setIsDepositDialogOpen(false);
                setDepositData({ userId: '', amount: '', reason: '', userSearch: '' });
                fetchData();
            } else {
                toast({ variant: "destructive", title: "خطأ", description: result.message });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل إضافة الإيداع" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <PageHeader
                    title="إدارة الإيداعات"
                    description="عرض وإضافة إيداعات رصيد المستخدمين."
                />
                <Dialog open={isDepositDialogOpen} onOpenChange={(open) => {
                    setIsDepositDialogOpen(open);
                    if (!open) setDepositData({ userId: '', amount: '', reason: '', userSearch: '' });
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="ml-2 h-4 w-4" />
                            إضافة إيداع
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>إضافة إيداع جديد</DialogTitle>
                            <DialogDescription>
                                إضافة رصيد لحساب مستخدم
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {!selectedUser ? (
                                <div className="space-y-3">
                                    <Label>البحث عن مستخدم</Label>
                                    <Input
                                        placeholder="البحث بالاسم أو البريد..."
                                        value={depositData.userSearch}
                                        onChange={(e) => setDepositData(prev => ({ ...prev, userSearch: e.target.value }))}
                                    />
                                    {filteredUsers.length > 0 && (
                                        <div className="border rounded-md max-h-40 overflow-y-auto">
                                            {filteredUsers.map(user => (
                                                <div
                                                    key={user.id}
                                                    className="p-2 hover:bg-muted cursor-pointer border-b last:border-0"
                                                    onClick={() => setDepositData(prev => ({ 
                                                        ...prev, 
                                                        userId: user.id,
                                                        userSearch: '' 
                                                    }))}
                                                >
                                                    <p className="font-medium text-sm">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-muted p-3 rounded-md">
                                        <div>
                                            <p className="font-medium">{selectedUser.name}</p>
                                            <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setDepositData(prev => ({ ...prev, userId: '', userSearch: '' }))}>
                                            تغيير
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>المبلغ ($)</Label>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={depositData.amount}
                                            onChange={(e) => setDepositData(prev => ({ ...prev, amount: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>سبب الإيداع</Label>
                                        <Textarea
                                            placeholder="اكتب سبب الإيداع..."
                                            value={depositData.reason}
                                            onChange={(e) => setDepositData(prev => ({ ...prev, reason: e.target.value }))}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDepositDialogOpen(false)}>
                                إلغاء
                            </Button>
                            <Button
                                onClick={handleDeposit}
                                disabled={!depositData.userId || !depositData.amount || !depositData.reason.trim() || isSubmitting}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                                إضافة الإيداع
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيداعات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalDeposits}</div>
                        <p className="text-xs text-muted-foreground">عملية إيداع</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المبالغ</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">${stats.totalAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">مجموع الإيداعات</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إيداعات اليوم</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">${stats.todayAmount.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">إيداعات اليوم</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>سجل الإيداعات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">المستخدم</TableHead>
                                    <TableHead className="text-right">المبلغ</TableHead>
                                    <TableHead className="text-right">السبب</TableHead>
                                    <TableHead className="text-right">بواسطة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deposits.length > 0 ? (
                                    deposits.map((deposit) => (
                                        <TableRow key={deposit.id}>
                                            <TableCell className="text-sm">
                                                {format(new Date(deposit.createdAt), "PP")}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{deposit.userName}</p>
                                                    <p className="text-xs text-muted-foreground">{deposit.userEmail}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium text-green-600">
                                                +${deposit.amount.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                                {deposit.reason}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {deposit.adminName}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            لا يوجد إيداعات حتى الآن
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
