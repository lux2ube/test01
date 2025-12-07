"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAllDeposits, getDepositStats, type AdminDeposit } from "./actions";
import { createAdminDeposit } from "../manage-withdrawals/actions";
import { getUsers } from "../users/actions";
import type { UserProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, DollarSign, TrendingUp, Calendar, User, Copy, Check, ClipboardList, Shield, Hash, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { columns } from "./columns";
import { Row, FilterFn } from "@tanstack/react-table";

const globalFilterFn: FilterFn<AdminDeposit> = (row, columnId, value) => {
    const search = value.toLowerCase();
    const deposit = row.original;
    
    return (
        deposit.userName?.toLowerCase().includes(search) ||
        deposit.userEmail?.toLowerCase().includes(search) ||
        deposit.reason?.toLowerCase().includes(search) ||
        deposit.adminName?.toLowerCase().includes(search) ||
        deposit.amount.toString().includes(search)
    );
};

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

function SubRow({ row }: { row: Row<AdminDeposit> }) {
    const deposit = row.original;
    const { toast } = useToast();
    
    const copyAllDetails = async () => {
        const detailsText = `المستخدم: ${deposit.userName}
البريد: ${deposit.userEmail}
المبلغ: $${deposit.amount.toFixed(2)}
السبب: ${deposit.reason}
المدير: ${deposit.adminName}
التاريخ: ${format(new Date(deposit.createdAt), 'PPpp', { locale: ar })}`;
        
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
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" />
                                معلومات المستخدم
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted">
                            <span className="text-muted-foreground text-xs">الاسم:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-sm">{deposit.userName}</span>
                                <CopyButton text={deposit.userName} label="الاسم" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted">
                            <span className="text-muted-foreground text-xs">البريد:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">{deposit.userEmail}</span>
                                <CopyButton text={deposit.userEmail} label="البريد" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-muted">
                            <span className="text-muted-foreground text-xs">معرف المستخدم:</span>
                            <div className="flex items-center gap-1">
                                <span className="font-mono text-xs">{deposit.userId.substring(0, 12)}...</span>
                                <CopyButton text={deposit.userId} label="معرف المستخدم" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2 text-green-700">
                                <DollarSign className="h-4 w-4" />
                                تفاصيل الإيداع
                            </CardTitle>
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
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-green-100/50">
                            <span className="text-muted-foreground text-xs">المبلغ:</span>
                            <span className="font-bold text-green-600 text-lg">${deposit.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-green-100/50">
                            <span className="text-muted-foreground text-xs">التاريخ:</span>
                            <span className="text-sm">{format(new Date(deposit.createdAt), 'PPpp', { locale: ar })}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            سبب الإيداع
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm bg-muted p-3 rounded-md">{deposit.reason || 'إيداع إداري'}</p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                            <Shield className="h-4 w-4" />
                            معلومات المدير
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-blue-100/50">
                            <span className="text-muted-foreground text-xs">اسم المدير:</span>
                            <Badge variant="secondary" className="gap-1">
                                <Shield className="h-3 w-3" />
                                {deposit.adminName || 'مدير'}
                            </Badge>
                        </div>
                        {deposit.adminId && (
                            <div className="flex items-center justify-between gap-2 py-1 px-2 rounded hover:bg-blue-100/50">
                                <span className="text-muted-foreground text-xs">معرف المدير:</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-mono text-xs">{deposit.adminId.substring(0, 12)}...</span>
                                    <CopyButton text={deposit.adminId} label="معرف المدير" />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

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

    const fetchData = useCallback(async () => {
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
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="إدارة الإيداعات"
                    description="عرض وإضافة إيداعات رصيد المستخدمين."
                />
                <Dialog open={isDepositDialogOpen} onOpenChange={(open) => {
                    setIsDepositDialogOpen(open);
                    if (!open) setDepositData({ userId: '', amount: '', reason: '', userSearch: '' });
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700 gap-2">
                            <Plus className="h-4 w-4" />
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

            <DataTable 
                columns={columns} 
                data={deposits}
                globalFilterFn={globalFilterFn}
                searchPlaceholder='بحث حسب المستخدم، المبلغ، السبب...'
                renderSubComponent={({ row }) => <SubRow row={row} />}
                getRowCanExpand={() => true}
            />
        </div>
    );
}
