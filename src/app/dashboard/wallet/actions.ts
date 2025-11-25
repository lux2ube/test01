'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';
import type { Withdrawal } from '@/types';

export type WalletDeposit = {
    id: string;
    type: 'cashback' | 'referral_commission';
    amount: number;
    date: Date;
    description: string;
    details: string;
};

export async function getWalletHistory(): Promise<{ 
    withdrawals: Withdrawal[];
    deposits: WalletDeposit[];
}> {
    const { id: userId } = await getAuthenticatedUser();
    try {
        const supabase = await createAdminClient();
        
        // Fetch withdrawals
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
            .from('withdrawals')
            .select('*')
            .eq('user_id', userId)
            .order('requested_at', { ascending: false });

        if (withdrawalsError) {
            console.error("Error fetching withdrawals:", withdrawalsError);
        }

        const withdrawals = (withdrawalsData || []).map(item => ({
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

        // Fetch deposits from ledger (cashback and referral commissions)
        const deposits: WalletDeposit[] = [];
        
        // Try to fetch from ledger transactions table
        const { data: ledgerData, error: ledgerError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .in('type', ['cashback', 'referral_commission'])
            .order('created_at', { ascending: false });

        if (!ledgerError && ledgerData) {
            ledgerData.forEach(tx => {
                const metadata = tx.metadata || {};
                let description = '';
                let details = '';
                
                if (tx.type === 'cashback') {
                    description = 'كاش باك';
                    details = metadata.broker ? `${metadata.broker} - ${metadata.account_number || ''}` : 'من التداول';
                } else if (tx.type === 'referral_commission') {
                    description = 'عمولة إحالة';
                    details = metadata.source_user_name ? `من ${metadata.source_user_name}` : 'عمولة من مُحال';
                }
                
                deposits.push({
                    id: tx.id,
                    type: tx.type,
                    amount: parseFloat(tx.amount),
                    date: new Date(tx.created_at),
                    description,
                    details,
                });
            });
        }
        
        // Also fetch from legacy cashback_transactions table for backwards compatibility
        const { data: cashbackData, error: cashbackError } = await supabase
            .from('cashback_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (!cashbackError && cashbackData) {
            // Get ledger reference IDs to avoid duplicates
            const ledgerReferenceIds = new Set((ledgerData || []).map(tx => tx.reference_id));
            
            cashbackData.forEach(item => {
                // Skip if already in ledger
                if (ledgerReferenceIds.has(item.id)) return;
                
                deposits.push({
                    id: item.id,
                    type: 'cashback',
                    amount: parseFloat(item.cashback_amount),
                    date: new Date(item.date),
                    description: 'كاش باك',
                    details: `${item.broker || ''} - ${item.account_number || ''}`.trim(),
                });
            });
        }
        
        // Sort deposits by date descending
        deposits.sort((a, b) => b.date.getTime() - a.date.getTime());

        return { withdrawals, deposits };

    } catch (error) {
        console.error("Error fetching wallet history:", error);
        return { withdrawals: [], deposits: [] };
    }
}
