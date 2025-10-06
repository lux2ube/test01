
"use client";

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getActivityLogs } from "../actions";
import type { ActivityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SecurityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const fetchedLogs = await getActivityLogs();
                setLogs(fetchedLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب سجلات النشاط.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [toast]);

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const lowerCaseQuery = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.userId.toLowerCase().includes(lowerCaseQuery) ||
            log.event.toLowerCase().includes(lowerCaseQuery) ||
            (log.ipAddress && log.ipAddress.toLowerCase().includes(lowerCaseQuery)) ||
            (log.geo?.country && log.geo.country.toLowerCase().includes(lowerCaseQuery))
        );
    }, [searchQuery, logs]);

    const getEventText = (event: ActivityLog['event']) => {
        const texts = {
            'login': 'تسجيل دخول',
            'signup': 'تسجيل جديد',
            'withdrawal_request': 'طلب سحب',
            'store_purchase': 'شراء من المتجر',
        };
        return texts[event] || event;
    }

    const getEventVariant = (event: ActivityLog['event']) => {
        switch (event) {
            case 'login': return 'default';
            case 'signup': return 'secondary';
            case 'withdrawal_request': return 'outline';
            case 'store_purchase': return 'outline';
            default: return 'outline';
        }
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader title="سجلات الأمان والنشاط" description="مراقبة أنشطة المستخدمين الرئيسية عبر التطبيق." />
            <Card>
                <CardHeader>
                    <CardTitle>كل السجلات</CardTitle>
                    <CardDescription>
                        تم العثور على {filteredLogs.length} من {logs.length} سجل.
                    </CardDescription>
                    <div className="relative max-w-sm">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="بحث حسب معرف المستخدم، الحدث، IP، أو البلد..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الوقت</TableHead>
                                        <TableHead>الحدث</TableHead>
                                        <TableHead>معرف المستخدم</TableHead>
                                        <TableHead>الموقع</TableHead>
                                        <TableHead>متصفح المستخدم</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(log.timestamp, 'PPp')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getEventVariant(log.event)} className="capitalize">
                                                        {getEventText(log.event)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{log.userId}</TableCell>
                                                <TableCell>
                                                    <div className="text-xs">{log.geo?.city}, {log.geo?.country || 'غير معروف'}</div>
                                                    <div className="text-xs text-muted-foreground font-mono">{log.ipAddress}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{log.userAgent}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                تم إيقاف عرض سجلات الأمان مؤقتًا.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
