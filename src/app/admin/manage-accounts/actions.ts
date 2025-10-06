'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { TradingAccount } from '@/types';

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

export async function getTradingAccounts(): Promise<TradingAccount[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('trading_accounts')
    .select('*');

  if (error) {
    console.error('Error fetching trading accounts:', error);
    return [];
  }

  return (data || []).map((acc) => ({
    id: acc.id,
    userId: acc.user_id,
    broker: acc.broker,
    accountNumber: acc.account_number,
    status: acc.status,
    createdAt: new Date(acc.created_at),
    rejectionReason: acc.rejection_reason,
  }));
}

export async function updateTradingAccountStatus(
  accountId: string,
  status: 'Approved' | 'Rejected',
  reason?: string
) {
  try {
    const supabase = await createAdminClient();
    
    const { data: account, error: fetchError } = await supabase
      .from('trading_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      throw new Error('لم يتم العثور على الحساب');
    }

    if (account.status !== 'Pending') {
      throw new Error(`لا يمكن تحديث الحساب. الحالة الحالية هي ${account.status}.`);
    }

    const updateData: { status: 'Approved' | 'Rejected'; rejection_reason?: string } = {
      status,
    };
    let message = `تم ${status === 'Approved' ? 'الموافقة على' : 'رفض'} حساب التداول الخاص بك ${
      account.account_number
    }.`;

    if (status === 'Rejected') {
      if (!reason) throw new Error('سبب الرفض مطلوب.');
      updateData.rejection_reason = reason;
      message += ` السبب: ${reason}`;
    } else {
      const { data: user } = await supabase
        .from('users')
        .select('status')
        .eq('id', account.user_id)
        .single();

      if (user && user.status === 'NEW') {
        await supabase
          .from('users')
          .update({ status: 'Active' })
          .eq('id', account.user_id);
      }
      updateData.rejection_reason = '';
    }

    const { error: updateError } = await supabase
      .from('trading_accounts')
      .update(updateData)
      .eq('id', accountId);

    if (updateError) throw updateError;

    await createNotification(account.user_id, message, 'account', '/dashboard/my-accounts');

    return { success: true, message: `تم تحديث حالة الحساب إلى ${status}.` };
  } catch (error) {
    console.error('Error updating account status:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    return { success: false, message: `فشل تحديث حالة الحساب: ${errorMessage}` };
  }
}

export async function adminAddTradingAccount(
  userId: string,
  brokerName: string,
  accountNumber: string
) {
  try {
    const supabase = await createAdminClient();
    
    const { data: existingAccounts } = await supabase
      .from('trading_accounts')
      .select('id')
      .eq('broker', brokerName)
      .eq('account_number', accountNumber);

    if (existingAccounts && existingAccounts.length > 0) {
      throw new Error('رقم حساب التداول هذا مرتبط بالفعل لهذا الوسيط.');
    }

    const { error: insertError } = await supabase
      .from('trading_accounts')
      .insert({
        user_id: userId,
        broker: brokerName,
        account_number: accountNumber,
        status: 'Approved',
        created_at: new Date().toISOString(),
      });

    if (insertError) throw insertError;

    await createNotification(
      userId,
      `تمت إضافة حسابك ${accountNumber} والموافقة عليه من قبل المسؤول.`,
      'account',
      '/dashboard/my-accounts'
    );

    const { data: user } = await supabase
      .from('users')
      .select('status')
      .eq('id', userId)
      .single();

    if (user && user.status === 'NEW') {
      await supabase
        .from('users')
        .update({ status: 'Active' })
        .eq('id', userId);
    }

    return { success: true, message: 'تمت إضافة الحساب والموافقة عليه بنجاح.' };
  } catch (error) {
    console.error('Error adding trading account: ', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير معروف';
    return { success: false, message: `فشل إضافة الحساب: ${errorMessage}` };
  }
}
