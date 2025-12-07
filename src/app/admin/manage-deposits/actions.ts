'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export interface AdminDeposit {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    reason: string;
    adminId: string;
    adminName: string;
    createdAt: Date;
}

export async function getAllDeposits(): Promise<{ deposits: AdminDeposit[], error?: string }> {
    try {
        const authenticatedUser = await getAuthenticatedUser();
        
        if (authenticatedUser.role !== 'admin') {
            return { deposits: [], error: 'غير مصرح' };
        }

        const supabase = await createAdminClient();
        
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('type', 'deposit')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching deposits:', error);
            return { deposits: [], error: 'فشل في جلب الإيداعات' };
        }

        const userIds = [...new Set((transactions || []).map(t => t.user_id))];
        
        const { data: users } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', userIds);

        const usersMap = new Map((users || []).map(u => [u.id, u]));

        const deposits = (transactions || []).map(t => {
            const user = usersMap.get(t.user_id);
            return {
                id: t.id,
                userId: t.user_id,
                userName: user?.name || 'غير معروف',
                userEmail: user?.email || '',
                amount: t.amount,
                reason: t.metadata?.reason || 'إيداع إداري',
                adminId: t.metadata?.deposited_by_admin_id || t.metadata?.actor_id || '',
                adminName: t.metadata?.deposited_by_admin_name || 'مدير',
                createdAt: new Date(t.created_at),
            } as AdminDeposit;
        });

        return { deposits };

    } catch (error) {
        console.error('Error in getAllDeposits:', error);
        return { deposits: [], error: 'حدث خطأ' };
    }
}

export async function getDepositStats(): Promise<{ totalDeposits: number; totalAmount: number; todayAmount: number }> {
    try {
        const authenticatedUser = await getAuthenticatedUser();
        
        if (authenticatedUser.role !== 'admin') {
            return { totalDeposits: 0, totalAmount: 0, todayAmount: 0 };
        }

        const supabase = await createAdminClient();
        
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('type', 'deposit');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const totalDeposits = transactions?.length || 0;
        const totalAmount = (transactions || []).reduce((sum, t) => sum + Number(t.amount), 0);
        const todayAmount = (transactions || [])
            .filter(t => new Date(t.created_at) >= today)
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return { totalDeposits, totalAmount, todayAmount };

    } catch (error) {
        console.error('Error in getDepositStats:', error);
        return { totalDeposits: 0, totalAmount: 0, todayAmount: 0 };
    }
}
