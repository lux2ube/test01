import React from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, TrendingUp, Briefcase } from "lucide-react";
import { getFinancialSummary } from './actions';
import { Progress } from '@/components/ui/progress';

export default async function FinancialReportsPage() {
    const summary = await getFinancialSummary();
    const grandTotal = summary.totalCashback + summary.totalReferralCommissions;

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="التقارير المالية" 
                description="ملخص إجمالي الكاش باك وعمولات الإحالة" 
            />

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الكاش باك</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            ${summary.totalCashback.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            من {summary.cashbackByBroker.reduce((sum, b) => sum + b.transactionCount, 0)} معاملة
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي عمولات الإحالة</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            ${summary.totalReferralCommissions.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            عمولات من برنامج الإحالة
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">المجموع الكلي</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${grandTotal.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            كاش باك + عمولات
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        الكاش باك حسب الوسيط
                    </CardTitle>
                    <CardDescription>
                        توزيع إجمالي الكاش باك على الوسطاء المختلفين
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.cashbackByBroker.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            لا توجد بيانات كاش باك
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-right">الوسيط</TableHead>
                                            <TableHead className="text-right">عدد المعاملات</TableHead>
                                            <TableHead className="text-right">إجمالي الكاش باك</TableHead>
                                            <TableHead className="text-right">النسبة</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.cashbackByBroker.map((broker) => {
                                            const percentage = summary.totalCashback > 0 
                                                ? (broker.totalCashback / summary.totalCashback) * 100 
                                                : 0;
                                            return (
                                                <TableRow key={broker.broker}>
                                                    <TableCell className="font-medium">{broker.broker}</TableCell>
                                                    <TableCell>{broker.transactionCount.toLocaleString()}</TableCell>
                                                    <TableCell className="font-semibold text-green-600">
                                                        ${broker.totalCashback.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={percentage} className="w-20 h-2" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {percentage.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {summary.cashbackByBroker.slice(0, 6).map((broker) => {
                                    const percentage = summary.totalCashback > 0 
                                        ? (broker.totalCashback / summary.totalCashback) * 100 
                                        : 0;
                                    return (
                                        <Card key={broker.broker} className="border">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-base">{broker.broker}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-green-600">
                                                    ${broker.totalCashback.toFixed(2)}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-muted-foreground">
                                                        {broker.transactionCount} معاملة
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                                <Progress value={percentage} className="mt-2 h-2" />
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
