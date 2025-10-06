

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { getUsers, backfillUserStatuses, backfillUserLevels } from './actions';
import { getClientLevels } from '@/app/actions';
import type { UserProfile, ClientLevel } from '@/types';
import { Loader2, History, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable } from '@/components/data-table/data-table';
import { getColumns } from './columns';


export default function ManageUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [levels, setLevels] = useState<ClientLevel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const fetchUsersAndLevels = async () => {
        setIsLoading(true);
        try {
            const [fetchedUsers, fetchedLevels] = await Promise.all([
                getUsers(),
                getClientLevels()
            ]);
            
            setLevels(fetchedLevels);
            fetchedUsers.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
            setUsers(fetchedUsers);

        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({ variant: 'destructive', title: 'خطأ', description: 'تعذر جلب المستخدمين.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsersAndLevels();
    }, []);

    const handleBackfill = async (action: 'status' | 'level') => {
        setIsUpdating(true);
        const result = action === 'status' 
            ? await backfillUserStatuses() 
            : await backfillUserLevels();
            
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchUsersAndLevels();
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: result.message });
        }
        setIsUpdating(false);
    };

    const levelMap = useMemo(() => {
        return new Map(levels.map(level => [level.id, level.name]));
    }, [levels]);

    const columns = useMemo(() => getColumns(levelMap), [levelMap]);

    if (isLoading) {
        return <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="container mx-auto space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                 <PageHeader title="إدارة المستخدمين" description="عرض وإدارة جميع المستخدمين المسجلين." />
                <div className="flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <History className="ml-2 h-4 w-4" />}
                                تحديث حالات المستخدمين
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    سيقوم هذا الإجراء بمراجعة جميع المستخدمين الذين ليس لديهم حالة وتعيينها بناءً على نشاطهم.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBackfill('status')}>متابعة التحديث</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Gem className="ml-2 h-4 w-4" />}
                                تحديث مستويات المستخدمين
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    سيقوم هذا الإجراء بإعادة حساب وتحديث مستوى كل مستخدم بناءً على أرباحهم الشهرية الحالية.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBackfill('level')}>متابعة التحديث</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            
            <DataTable 
                columns={columns} 
                data={users} 
                searchPlaceholder="بحث بالاسم، البريد، ID..."
                filterableColumns={[
                    {
                        id: 'status',
                        title: 'الحالة',
                        options: [
                            { value: 'NEW', label: 'جديد' },
                            { value: 'Active', label: 'نشط' },
                            { value: 'Trader', label: 'متداول' },
                        ]
                    },
                    {
                        id: 'level',
                        title: 'المستوى',
                        options: levels.map(level => ({ value: level.id.toString(), label: level.name })),
                    }
                ]}
            />
        </div>
    );
}
