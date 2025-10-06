
"use client";

import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Download, CheckCircle, XCircle } from "lucide-react";
import { DataTable } from '@/components/data-table/data-table';
import { columns } from './columns';
import { getApprovedAccounts, processBulkCashback } from './actions';
import type { TradingAccount, CashbackTransaction } from '@/types';

type BulkCashbackRow = CashbackTransaction & { status: 'Accepted' | 'Rejected'; reason?: string, originalRow: number };

export default function BulkCashbackPage() {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<BulkCashbackRow[]>([]);
    const [rowSelection, setRowSelection] = useState({});

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

        setIsProcessing(true);
        setParsedData([]);

        try {
            const approvedAccounts = await getApprovedAccounts();
            const accountsMap = new Map(approvedAccounts.map(acc => [acc.accountNumber, acc]));
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number)[][];

                const validatedData: BulkCashbackRow[] = [];
                const seen = new Set<string>();

                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const accountNumber = String(row[0] || '').trim();

                    // Skip empty rows
                    if (!accountNumber) {
                        continue;
                    }
                    
                    const amount = parseFloat(String(row[1] || '0'));
                    const note = String(row[2] || 'No Notes').trim();

                    const rowIdentifier = `${accountNumber}-${amount}`;
                    
                    let status: 'Accepted' | 'Rejected' = 'Accepted';
                    let reason = '';

                    const accountInfo = accountsMap.get(accountNumber);
                    
                    if (!accountInfo) {
                        status = 'Rejected';
                        reason = 'Trading account not found or not approved.';
                    } else if (isNaN(amount) || amount <= 0) {
                        status = 'Rejected';
                        reason = 'Invalid amount.';
                    } else if (seen.has(rowIdentifier)) {
                        status = 'Rejected';
                        reason = 'Duplicate row in file.';
                    } else {
                        seen.add(rowIdentifier);
                    }
                    
                    validatedData.push({
                        status, reason,
                        accountNumber,
                        cashbackAmount: amount,
                        note,
                        // Enrich with the necessary data for the cashback logic
                        userId: accountInfo?.userId,
                        accountId: accountInfo?.id,
                        broker: accountInfo?.broker,
                    } as BulkCashbackRow);
                }
                setParsedData(validatedData);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch approved accounts.' });
        } finally {
            setIsProcessing(false);
            if(event.target) event.target.value = ''; // Reset file input
        }
    };
    
    const handleConfirm = async () => {
        setIsProcessing(true);
        const selectedRows = parsedData.filter((_, index) => (rowSelection as any)[index]);
        const result = await processBulkCashback(selectedRows);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
            setParsedData([]);
            setRowSelection({});
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
        setIsProcessing(false);
    };

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="Bulk Cashback Import" description="Upload an Excel file to add multiple cashback transactions at once." />

            <Card>
                <CardHeader>
                    <CardTitle>1. Get Sample File</CardTitle>
                    <CardDescription>Download the sample Excel file to see the required format.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDownloadSample} variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Download Sample
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>2. Import Data</CardTitle>
                    <CardDescription>Upload your completed Excel file. The data will be validated but not saved yet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <label htmlFor="file-upload" className="relative cursor-pointer">
                            <Button asChild>
                                <div><Upload className="mr-2 h-4 w-4" /> Import Excel File</div>
                            </Button>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept=".xlsx, .xls, .csv"/>
                        </label>
                        {isProcessing && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                </CardContent>
            </Card>

            {parsedData.length > 0 && (
                 <Card>
                    <CardHeader>
                        <CardTitle>3. Review and Confirm</CardTitle>
                        <CardDescription>Review the imported data. Rows marked as "Rejected" will be ignored.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <DataTable
                            columns={columns}
                            data={parsedData}
                            state={{ rowSelection }}
                            onRowSelectionChange={setRowSelection}
                            enableRowSelection={(row) => row.original.status === 'Accepted'}
                        >
                            {(table) => (
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        disabled={isProcessing || table.getFilteredSelectedRowModel().rows.length === 0}
                                        onClick={handleConfirm}
                                    >
                                        {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                                        Confirm {table.getFilteredSelectedRowModel().rows.length} Selected
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setParsedData([])}
                                        disabled={isProcessing}
                                    >
                                        <XCircle className="ml-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </DataTable>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
