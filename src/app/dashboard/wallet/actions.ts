
'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import type { Withdrawal } from '@/types';

export async function getWalletHistory(): Promise<{ withdrawals: Withdrawal[] }> {
    const { uid: userId } = await getAuthenticatedUser();
    try {
        const supabase = await createAdminClient();
        const { data, error } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('requested_at', { ascending: false });

        if (error) {
            console.error("Error fetching wallet history:", error);
            return { withdrawals: [] };
        }

        const withdrawals = (data || []).map(item => ({
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

        return { withdrawals };

    } catch (error) {
        console.error("Error fetching wallet history:", error);
        return { withdrawals: [] };
    }
}
