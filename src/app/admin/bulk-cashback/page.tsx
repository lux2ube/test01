"use client";

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApprovedAccounts, confirmSingleCashback, type BulkCashbackRecord } from './actions';

export default function BulkCashbackPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<BulkCashbackRecord[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleDownloadSample = () => {
        const sampleData = [
            { "Trading Account Number": "123456", "Amount (USD)": "100.50", "Note": "October cashback" },
        ];
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Cashback");
        XLSX.writeFile(workbook, "cashback_sample.xlsx");
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setRecords([]);

        try {
            const approvedAccounts = await getApprovedAccounts();
            const accountsMap = new Map(approvedAccounts.map(acc => [acc.accountNumber, acc]));
            
            const reader = new FileReader();
            reader.onerror = () => {
                toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في قراءة الملف' });
                setIsLoading(false);
            };
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

                const parsedRecords: BulkCashbackRecord[] = [];
                const seen = new Set<string>();

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const accountNumber = String(row[0] || '').trim();

                    if (!accountNumber) {
                        continue;
                    }
                    
                    const amount = parseFloat(String(row[1] || '0'));
                    const note = String(row[2] || 'Bulk import').trim();

                    const rowIdentifier = `${accountNumber}-${amount}-${i}`;
                    const uniqueId = `bulk-${Date.now()}-${i}`;
                    
                    let status: BulkCashbackRecord['status'] = 'pending';
                    let reason = '';

                    const accountInfo = accountsMap.get(accountNumber);
                    
                    if (!accountInfo) {
                        status = 'rejected';
                        reason = 'حساب التداول غير موجود أو غير معتمد';
                    } else if (isNaN(amount) || amount <= 0) {
                        status = 'rejected';
                        reason = 'المبلغ غير صالح';
                    } else if (seen.has(`${accountNumber}-${amount}`)) {
                        status = 'rejected';
                        reason = 'سجل مكرر في الملف';
                    } else {
                        seen.add(`${accountNumber}-${amount}`);
                    }
                    
                    parsedRecords.push({
                        id: uniqueId,
                        accountNumber,
                        cashbackAmount: amount,
                        note,
                        userId: accountInfo?.userId || '',
                        accountId: accountInfo?.id || '',
                        broker: accountInfo?.broker || '',
                        status,
                        reason,
                    });
                }
                
                setRecords(parsedRecords);
                setIsLoading(false);
                
                if (parsedRecords.length === 0) {
                        toast({ 
                            variant: 'destructive', 
                            title: 'لا توجد بيانات', 
                            description: 'الملف لا يحتوي على بيانات صالحة' 
                        });
                    } else {
                        const pendingCount = parsedRecords.filter(r => r.status === 'pending').length;
                        const rejectedCount = parsedRecords.filter(r => r.status === 'rejected').length;
                        toast({ 
                            title: 'تم استيراد الملف', 
                            description: `${pendingCount} سجل جاهز للتأكيد، ${rejectedCount} سجل مرفوض` 
                        });
                    }
                } catch (parseError) {
                    toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في تحليل الملف. تأكد من صحة التنسيق.' });
                    setIsLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطأ', description: 'فشل في استيراد الملف' });
            setIsLoading(false);
        } finally {
            if(event.target) event.target.value = '';
        }
    };
    
    const handleConfirmRecord = async (record: BulkCashbackRecord) => {
        if (record.status !== 'pending') return;
        
        setProcessingId(record.id);
        
        try {
            const result = await confirmSingleCashback(record);
            
            setRecords(prev => prev.map(r => {
                if (r.id === record.id) {
                    return {
                        ...r,
                        status: result.success ? 'confirmed' : 'error',
                        reason: result.success ? 'تمت الإضافة بنجاح' : result.message,
                    };
                }
                return r;
            }));
            
            if (result.success) {
                toast({ 
                    title: 'تم التأكيد', 
                    description: `تم إضافة ${record.cashbackAmount}$ للحساب ${record.accountNumber}` 
                });
            } else {
                toast({ 
                    variant: 'destructive', 
                    title: 'فشل التأكيد', 
                    description: result.message 
                });
            }
        } catch (error) {
            setRecords(prev => prev.map(r => {
                if (r.id === record.id) {
                    return {
                        ...r,
                        status: 'error',
                        reason: 'حدث خطأ غير متوقع',
                    };
                }
                return r;
            }));
            toast({ 
                variant: 'destructive', 
                title: 'خطأ', 
                description: 'فشل في تأكيد السجل' 
            });
        } finally {
            setProcessingId(null);
        }
    };

    const handleClearAll = () => {
        setRecords([]);
    };

    const getStatusBadge = (status: BulkCashbackRecord['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> قيد الانتظار</Badge>;
            case 'confirmed':
                return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> تم التأكيد</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> مرفوض</Badge>;
            case 'error':
                return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> خطأ</Badge>;
        }
    };

    const pendingCount = records.filter(r => r.status === 'pending').length;
    const confirmedCount = records.filter(r => r.status === 'confirmed').length;
    const rejectedCount = records.filter(r => r.status === 'rejected').length;
    const errorCount = records.filter(r => r.status === 'error').length;

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader 
                title="استيراد الكاش باك بالجملة" 
                description="قم برفع ملف Excel لإضافة معاملات كاش باك متعددة. يمكنك تأكيد كل سجل على حدة." 
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>1. تحميل نموذج الملف</CardTitle>
                        <CardDescription>قم بتحميل ملف Excel النموذجي لمعرفة التنسيق المطلوب.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleDownloadSample} variant="outline">
                            <Download className="ml-2 h-4 w-4" /> تحميل النموذج
                        </Button>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>2. رفع الملف</CardTitle>
                        <CardDescription>قم برفع ملف Excel المكتمل. سيتم التحقق من البيانات قبل الحفظ.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <label htmlFor="file-upload" className="relative cursor-pointer">
                                <Button asChild disabled={isLoading}>
                                    <div>
                                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
                                        رفع ملف Excel
                                    </div>
                                </Button>
                                <input 
                                    id="file-upload" 
                                    name="file-upload" 
                                    type="file" 
                                    className="sr-only" 
                                    onChange={handleFileUpload} 
                                    accept=".xlsx, .xls, .csv"
                                    disabled={isLoading}
                                />
                            </label>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {records.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>3. مراجعة وتأكيد السجلات</CardTitle>
                                <CardDescription className="mt-1">
                                    اضغط على زر "تأكيد" لكل سجل تريد إضافته. السجلات المرفوضة لا يمكن تأكيدها.
                                </CardDescription>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleClearAll}
                                disabled={processingId !== null}
                            >
                                <XCircle className="ml-2 h-4 w-4" /> مسح الكل
                            </Button>
                        </div>
                        <div className="flex gap-4 mt-4 text-sm">
                            <span className="text-muted-foreground">
                                الإجمالي: <strong>{records.length}</strong>
                            </span>
                            <span className="text-yellow-600">
                                قيد الانتظار: <strong>{pendingCount}</strong>
                            </span>
                            <span className="text-green-600">
                                تم التأكيد: <strong>{confirmedCount}</strong>
                            </span>
                            <span className="text-red-600">
                                مرفوض/خطأ: <strong>{rejectedCount + errorCount}</strong>
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">رقم الحساب</TableHead>
                                        <TableHead className="text-right">الوسيط</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                        <TableHead className="text-right">الملاحظة</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-right">السبب</TableHead>
                                        <TableHead className="text-right">الإجراء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-mono">{record.accountNumber}</TableCell>
                                            <TableCell>{record.broker || '-'}</TableCell>
                                            <TableCell className="font-semibold">${record.cashbackAmount.toFixed(2)}</TableCell>
                                            <TableCell className="max-w-[200px] truncate">{record.note}</TableCell>
                                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                                {record.reason || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {record.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirmRecord(record)}
                                                        disabled={processingId !== null}
                                                    >
                                                        {processingId === record.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="ml-1 h-4 w-4" />
                                                                تأكيد
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                                {record.status === 'confirmed' && (
                                                    <span className="text-green-600 text-sm">✓ تم</span>
                                                )}
                                                {(record.status === 'rejected' || record.status === 'error') && (
                                                    <span className="text-red-600 text-sm">✗</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
