'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import type { Withdrawal } from '@/types';

export interface Deposit {
    id: string;
    userId: string;
    amount: number;
    reason: string;
    adminName: string;
    createdAt: Date;
}

export async function getWalletHistory(): Promise<{ withdrawals: Withdrawal[], deposits: Deposit[] }> {
    const { id: userId } = await getAuthenticatedUser();
    try {
        const supabase = await createAdminClient();
        
        const [withdrawalsResult, depositsResult] = await Promise.all([
            supabase
                .from('withdrawals')
                .select('*')
                .eq('user_id', userId)
                .order('requested_at', { ascending: false }),
            supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .eq('type', 'deposit')
                .order('created_at', { ascending: false })
        ]);

        if (withdrawalsResult.error) {
            console.error("Error fetching withdrawals:", withdrawalsResult.error);
        }
        
        if (depositsResult.error) {
            console.error("Error fetching deposits:", depositsResult.error);
        }

        const withdrawals = (withdrawalsResult.data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            amount: item.amount,
            paymentMethod: item.payment_method,
            status: item.status,
            requestedAt: new Date(item.requested_at),
            completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
            withdrawalDetails: item.withdrawal_details,
            txId: item.tx_id,
            rejectionReason: item.rejection_reason,
        } as Withdrawal));

        const deposits = (depositsResult.data || []).map(item => ({
            id: item.id,
            userId: item.user_id,
            amount: item.amount,
            reason: item.metadata?.reason || 'إيداع إداري',
            adminName: item.metadata?.deposited_by_admin_name || 'مدير',
            createdAt: new Date(item.created_at),
        } as Deposit));

        return { withdrawals, deposits };

    } catch (error) {
        console.error("Error fetching wallet history:", error);
        return { withdrawals: [], deposits: [] };
    }
}
