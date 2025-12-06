'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { Withdrawal, WhitelistPayment } from '@/types';

async function addToWhitelist(
  userId: string,
  paymentMethod: string,
  paymentDetails: Record<string, any>,
  withdrawalId: string
) {
  const supabase = await createAdminClient();
  
  const paymentSignature = createPaymentSignature(paymentDetails);
  const primaryIdentifier = extractPrimaryIdentifier(paymentDetails);
  
  const { error } = await supabase
    .from('whitelist_payments')
    .upsert({
      user_id: userId,
      payment_method: paymentMethod,
      wallet_address: primaryIdentifier,
      payment_signature: paymentSignature,
      payment_details: paymentDetails,
      approved_by_withdrawal_id: withdrawalId,
      approved_at: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'user_id,payment_method,payment_signature',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('Error adding to whitelist:', error);
  }
  
  return !error;
}

async function isPaymentWhitelisted(
  userId: string,
  paymentMethod: string,
  paymentDetails: Record<string, any>
): Promise<boolean> {
  const supabase = await createAdminClient();
  
  const paymentSignature = createPaymentSignature(paymentDetails);
  
  const { data, error } = await supabase
    .from('whitelist_payments')
    .select('id')
    .eq('user_id', userId)
    .eq('payment_method', paymentMethod)
    .eq('payment_signature', paymentSignature)
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return false;
  }
  
  return true;
}

/**
 * Creates a deterministic signature from all payment details.
 * This ensures that ALL fields are considered when checking for whitelist matches.
 * For example, a crypto payment with wallet + network + memo will only match
 * if all three fields are identical.
 * 
 * Uses a simple key=value|key=value format for reliability.
 * Keys are lowercased for consistency, VALUES ARE PRESERVED EXACTLY for security
 * (case-sensitive wallet addresses like Base58 require exact matching).
 * This approach avoids JSON formatting discrepancies between TypeScript and PostgreSQL.
 */
function createPaymentSignature(details: Record<string, unknown>): string {
  if (!details || Object.keys(details).length === 0) {
    return '';
  }

  const sortedKeys = Object.keys(details).sort();
  const parts = sortedKeys.map(key => {
    const value = details[key];
    const stringValue = value === null || value === undefined 
      ? '' 
      : String(value).trim();
    return `${key.toLowerCase()}=${stringValue}`;
  });

  return parts.join('|');
}

/**
 * Extracts the primary wallet/account identifier for display purposes.
 * Used for showing a human-readable identifier in the UI.
 */
function extractPrimaryIdentifier(details: Record<string, any>): string {
  const walletKeys = ['walletAddress', 'wallet_address', 'address', 'binanceId', 'accountNumber'];
  for (const key of walletKeys) {
    if (details[key]) {
      return String(details[key]);
    }
  }
  const firstKey = Object.keys(details)[0];
  if (firstKey && details[firstKey]) {
    return String(details[firstKey]);
  }
  return '';
}

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

  const withdrawals = await Promise.all((data || []).map(async (row) => {
    const paymentDetails = row.withdrawal_details || {};
    const isWhitelisted = await isPaymentWhitelisted(
      row.user_id,
      row.payment_method,
      paymentDetails
    );
    
    return {
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
      isWhitelisted,
    };
  }));
  
  return withdrawals;
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

    const { changeWithdrawalStatusInLedger } = await import('@/app/actions/ledger');
    
    const ledgerResult = await changeWithdrawalStatusInLedger(
      withdrawal.user_id,
      withdrawal.id,
      'processing',
      'completed',
      withdrawal.amount,
      { tx_id: txId }
    );

    if (!ledgerResult.success) {
      throw new Error(ledgerResult.error || 'فشل تحديث حالة السحب في النظام المحاسبي');
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

    await addToWhitelist(
      withdrawal.user_id,
      withdrawal.payment_method,
      withdrawal.withdrawal_details || {},
      withdrawalId
    );

    const message = `تم إكمال طلب السحب الخاص بك بمبلغ ${withdrawal.amount.toFixed(2)}$.`;
    await createNotification(withdrawal.user_id, message, 'withdrawal', '/dashboard/withdraw');

    return { success: true, message: 'تمت الموافقة على السحب بنجاح مع TXID.' };
  } catch (error) {
    console.error('Error approving withdrawal:', error);
    const errorMessage = error instanceof Error ? error.message : 'فشل الموافقة على السحب.';
    return { success: false, message: errorMessage };
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

    const { changeWithdrawalStatusInLedger } = await import('@/app/actions/ledger');
    
    const ledgerResult = await changeWithdrawalStatusInLedger(
      withdrawal.user_id,
      withdrawal.id,
      'processing',
      'cancelled',
      withdrawal.amount,
      { rejection_reason: reason }
    );

    if (!ledgerResult.success) {
      throw new Error(ledgerResult.error || 'فشل تحديث حالة السحب في النظام المحاسبي');
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
