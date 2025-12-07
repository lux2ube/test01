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

/**
 * Admin Balance Adjustment - Decrease user balance
 * 
 * This function creates a completed withdrawal record to decrease user balance.
 * It follows the same financial flow as regular withdrawals:
 * 1. Creates withdrawal in 'processing' state (increases pending_withdrawals)
 * 2. Immediately completes it (decreases pending_withdrawals, increases total_withdrawn)
 * 
 * The withdrawal is marked as 'admin_adjustment' to distinguish from user withdrawals.
 * SECURITY: Requires admin authentication and records admin ID in audit trail.
 */
export async function createAdminBalanceAdjustment(
  userId: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; message: string; withdrawalId?: string }> {
  try {
    // SECURITY: Verify admin authentication using Supabase auth.getUser() 
    // This validates the session token through Supabase, not just reading cookies
    const { getAuthenticatedUser } = await import('@/lib/auth/server-auth');
    
    let authenticatedUser;
    try {
      authenticatedUser = await getAuthenticatedUser();
    } catch {
      return { success: false, message: 'غير مصرح: يرجى تسجيل الدخول' };
    }

    // Verify user has admin role (getAuthenticatedUser already fetches role from database)
    if (authenticatedUser.role !== 'admin') {
      console.error('Admin verification failed: User role is', authenticatedUser.role);
      return { success: false, message: 'غير مصرح: صلاحيات المدير مطلوبة' };
    }

    const adminId = authenticatedUser.id;
    
    // Fetch admin name for audit trail
    const supabase = await createAdminClient();
    const { data: adminProfile } = await supabase
      .from('users')
      .select('name')
      .eq('id', adminId)
      .single();
    
    const adminName = adminProfile?.name || 'مدير';

    if (!userId || !amount || amount <= 0) {
      return { success: false, message: 'معرف المستخدم والمبلغ مطلوبان' };
    }

    if (!reason || !reason.trim()) {
      return { success: false, message: 'سبب التعديل مطلوب' };
    }

    // Check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, message: 'المستخدم غير موجود' };
    }

    // Check user has sufficient balance
    const { getUserBalanceAdmin } = await import('@/app/actions/ledger');
    const balanceResult = await getUserBalanceAdmin(userId);
    
    if (!balanceResult.success) {
      return { success: false, message: 'فشل التحقق من رصيد المستخدم' };
    }

    if (balanceResult.balance.available_balance < amount) {
      return { 
        success: false, 
        message: `الرصيد المتاح غير كافٍ. الرصيد الحالي: ${balanceResult.balance.available_balance.toFixed(2)}$` 
      };
    }

    // Create withdrawal record marked as admin adjustment with admin attribution
    const { data: withdrawal, error: insertError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        status: 'Processing',
        payment_method: 'تعديل إداري',
        withdrawal_details: {
          type: 'admin_adjustment',
          reason: reason,
          adjusted_by_admin_id: adminId,
          adjusted_by_admin_name: adminName,
          adjusted_at: new Date().toISOString()
        },
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !withdrawal) {
      console.error('Error creating adjustment withdrawal:', insertError);
      return { success: false, message: 'فشل إنشاء سجل التعديل' };
    }

    // Step 1: Create withdrawal in ledger (increases pending_withdrawals)
    // SECURITY: Use admin ID as actor for proper audit trail
    const { createWithdrawal } = await import('@/lib/ledger/service');
    try {
      await createWithdrawal({
        userId,
        amount,
        referenceId: withdrawal.id,
        metadata: {
          type: 'admin_adjustment',
          reason: reason,
          target_user_id: userId,
          _actor_id: adminId,
          _actor_action: 'admin_balance_adjustment'
        }
      });
    } catch (ledgerError) {
      // Rollback withdrawal record
      await supabase.from('withdrawals').delete().eq('id', withdrawal.id);
      console.error('Error creating ledger withdrawal:', ledgerError);
      return { success: false, message: 'فشل تحديث النظام المحاسبي' };
    }

    // Step 2: Complete withdrawal in ledger (decreases pending, increases withdrawn)
    // SECURITY: Use admin ID as actor for proper audit trail
    const { changeWithdrawalStatusInLedger } = await import('@/app/actions/ledger');
    const ledgerResult = await changeWithdrawalStatusInLedger(
      userId,
      withdrawal.id,
      'processing',
      'completed',
      amount,
      { 
        type: 'admin_adjustment',
        reason: reason,
        target_user_id: userId,
        _actor_id: adminId,
        _actor_action: 'admin_balance_adjustment_complete'
      }
    );

    if (!ledgerResult.success) {
      // Mark withdrawal as failed if ledger update fails
      await supabase
        .from('withdrawals')
        .update({ status: 'Failed', rejection_reason: 'فشل في النظام المحاسبي' })
        .eq('id', withdrawal.id);
      return { success: false, message: ledgerResult.error || 'فشل إكمال التعديل في النظام المحاسبي' };
    }

    // Update withdrawal record to completed
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'Completed',
        completed_at: new Date().toISOString(),
        tx_id: `ADJ-${Date.now()}`
      })
      .eq('id', withdrawal.id);

    if (updateError) {
      console.error('Error updating withdrawal status:', updateError);
    }

    // Create notification for user
    const message = `تم خصم مبلغ ${amount.toFixed(2)}$ من رصيدك. السبب: ${reason}`;
    await createNotification(userId, message, 'withdrawal', '/dashboard/withdraw');

    return { 
      success: true, 
      message: `تم خصم ${amount.toFixed(2)}$ من رصيد المستخدم بنجاح`,
      withdrawalId: withdrawal.id
    };
  } catch (error) {
    console.error('Error creating admin balance adjustment:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return { success: false, message: errorMessage };
  }
}
