
"use client"

import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { getUserActivityLogs } from '@/app/admin/users/actions';
import type { ActivityLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function UserActivityLogsPage() {
    const { user } = useAuthContext();
    const router = useRouter();
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const userLogs = await getUserActivityLogs(user.id);
                setLogs(userLogs);
            } catch (error) {
                console.error("Failed to fetch logs:", error);
                toast({ variant: 'destructive', title: 'خطأ', description: 'لا يمكن جلب سجلات نشاطك.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [user, toast]);

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
        <div className="space-y-6">
            <PageHeader title="نشاطك" description="سجل بالأحداث الأخيرة المتعلقة بالأمان." />

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">الأحداث الأخيرة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : logs.length > 0 ? (
                        logs.map(log => (
                            <div key={log.id} className="flex items-start gap-4">
                                <div className="text-xs text-muted-foreground text-right">
                                    <p>{format(log.timestamp, 'MMM d')}</p>
                                    <p>{format(log.timestamp, 'p')}</p>
                                </div>
                                <div className="pl-4 border-l flex-grow">
                                    <p className="font-semibold text-sm capitalize">{log.event.replace('_', ' ')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        من {log.geo?.city || 'مدينة غير معروفة'}, {log.geo?.country || 'دولة غير معروفة'} ({log.ipAddress})
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                       <p className="text-center text-muted-foreground text-sm py-8">لم يتم العثور على سجلات نشاط.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

    