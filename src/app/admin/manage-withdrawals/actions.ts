'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Withdrawal } from '@/types';

async function createNotification(
  userId: string,
  message: string,
  type: 'account' | 'cashback' | 'withdrawal' | 'general' | 'store' | 'loyalty' | 'announcement',
  link?: string
) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      message,
      type,
      link,
      is_read: false,
      created_at: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error creating notification:', error);
  }
}

export async function getWithdrawals(): Promise<Withdrawal[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .order('requested_at', { ascending: false });

  if (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    amount: row.amount,
    status: row.status,
    paymentMethod: row.payment_method,
    withdrawalDetails: row.withdrawal_details,
    requestedAt: new Date(row.requested_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    txId: row.tx_id,
    rejectionReason: row.rejection_reason,
    previousWithdrawalDetails: row.previous_withdrawal_details,
  }));
}

export async function approveWithdrawal(withdrawalId: string, txId: string) {
  try {
    const supabase = await createAdminClient();
    
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      throw new Error('لم يتم العثور على طلب السحب');
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        tx_id: txId,
        rejection_reason: '',
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    const message = `تم إكمال طلب السحب الخاص بك بمبلغ ${withdrawal.amount.toFixed(2)}$.`;
    await createNotification(withdrawal.user_id, message, 'withdrawal', '/dashboard/withdraw');

    return { success: true, message: 'تمت الموافقة على السحب بنجاح مع TXID.' };
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    return { success: false, message: 'فشل الموافقة على السحب.' };
  }
}

export async function rejectWithdrawal(withdrawalId: string, reason: string) {
  try {
    const supabase = await createAdminClient();
    
    if (!reason) throw new Error('سبب الرفض مطلوب.');
    
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      throw new Error('لم يتم العثور على طلب السحب');
    }

    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'Failed',
        rejection_reason: reason,
      })
      .eq('id', withdrawalId);

    if (updateError) throw updateError;

    const message = `فشل طلب السحب الخاص بك بمبلغ ${withdrawal.amount.toFixed(2)}$. السبب: ${reason}`;
    await createNotification(withdrawal.user_id, message, 'withdrawal', '/dashboard/withdraw');

    return { success: true, message: `تم تحديث حالة السحب إلى "فشل".` };
  } catch (error) {
    console.error('Error rejecting withdrawal:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    return { success: false, message: `فشل رفض السحب: ${errorMessage}` };
  }
}
