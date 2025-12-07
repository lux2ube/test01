import React from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Wallet, TrendingUp, ArrowDownUp, ShoppingBag } from "lucide-react";
import { getUserBalances, getTotalBalanceSummary } from './actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function UserBalancesPage() {
    const [balances, summary] = await Promise.all([
        getUserBalances(),
        getTotalBalanceSummary()
    ]);

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="أرصدة المستخدمين" 
                description="عرض أرصدة جميع المستخدمين الذين لديهم رصيد غير صفري" 
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الأرصدة المتاحة</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${summary.totalAvailable.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {summary.userCount} مستخدم نشط
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المكتسب</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${summary.totalEarned.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            + ${summary.totalDeposit.toFixed(2)} إيداعات
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المسحوب</CardTitle>
                        <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            ${summary.totalWithdrawn.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            + ${summary.totalPending.toFixed(2)} قيد المعالجة
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            ${summary.totalOrders.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            طلبات قيد المعالجة
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        قائمة الأرصدة ({balances.length} مستخدم)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {balances.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            لا يوجد مستخدمين بأرصدة غير صفرية
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">المستخدم</TableHead>
                                        <TableHead className="text-right">رقم العميل</TableHead>
                                        <TableHead className="text-right">المكتسب</TableHead>
                                        <TableHead className="text-right">الإيداعات</TableHead>
                                        <TableHead className="text-right">المسحوب</TableHead>
                                        <TableHead className="text-right">قيد المعالجة</TableHead>
                                        <TableHead className="text-right">الطلبات</TableHead>
                                        <TableHead className="text-right">الرصيد المتاح</TableHead>
                                        <TableHead className="text-right">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {balances.map((balance) => (
                                        <TableRow key={balance.userId}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{balance.name}</div>
                                                    <div className="text-sm text-muted-foreground">{balance.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{balance.clientId || '-'}</TableCell>
                                            <TableCell className="text-green-600">${balance.totalEarned.toFixed(2)}</TableCell>
                                            <TableCell className="text-blue-600">${balance.totalDeposit.toFixed(2)}</TableCell>
                                            <TableCell className="text-red-600">${balance.totalWithdrawn.toFixed(2)}</TableCell>
                                            <TableCell className="text-yellow-600">${balance.totalPendingWithdrawals.toFixed(2)}</TableCell>
                                            <TableCell className="text-orange-600">${balance.totalOrders.toFixed(2)}</TableCell>
                                            <TableCell className="font-bold text-green-700">${balance.availableBalance.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Link href={`/admin/users/${balance.userId}`}>
                                                    <Button variant="outline" size="sm">عرض</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
