'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { CashbackTransaction, UserProfile } from '@/types';
import { awardReferralCommission } from '../actions';

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

export async function addCashbackTransaction(
  data: Omit<CashbackTransaction, 'id' | 'date'>
) {
  try {
    const supabase = await createAdminClient();
    
    const { error: insertError } = await supabase
      .from('cashback_transactions')
      .insert({
        user_id: data.userId,
        account_id: data.accountId,
        account_number: data.accountNumber,
        broker: data.broker,
        date: new Date().toISOString(),
        trade_details: data.tradeDetails,
        cashback_amount: data.cashbackAmount,
      });

    if (insertError) throw insertError;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('monthly_earnings')
      .eq('id', data.userId)
      .single();

    if (userError) throw userError;
    if (!user) throw new Error(`User with id ${data.userId} not found.`);

    const newMonthlyEarnings = (user.monthly_earnings || 0) + data.cashbackAmount;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ monthly_earnings: newMonthlyEarnings })
      .eq('id', data.userId);

    if (updateError) throw updateError;

    const message = `لقد تلقيت ${data.cashbackAmount.toFixed(
      2
    )}$ كاش باك للحساب ${data.accountNumber}.`;
    await createNotification(data.userId, message, 'cashback', '/dashboard/transactions');

    await awardReferralCommission(data.userId, 'cashback', data.cashbackAmount);

    return { success: true, message: 'تمت إضافة معاملة الكاش باك بنجاح.' };
  } catch (error) {
    console.error('Error adding cashback transaction:', error);
    return { success: false, message: 'فشل إضافة معاملة الكاش باك.' };
  }
}

export async function getCashbackHistory(): Promise<
  (CashbackTransaction & { userProfile?: Partial<UserProfile> })[]
> {
  const supabase = await createAdminClient();
  
  const [transactionsResult, usersResult] = await Promise.all([
    supabase.from('cashback_transactions').select('*').order('date', { ascending: false }),
    supabase.from('users').select('id, name, email, client_id'),
  ]);

  const usersMap = new Map(
    (usersResult.data || []).map((user) => [user.id, user])
  );

  return (transactionsResult.data || []).map((tx) => {
    const user = usersMap.get(tx.user_id);
    return {
      id: tx.id,
      userId: tx.user_id,
      accountId: tx.account_id,
      accountNumber: tx.account_number,
      broker: tx.broker,
      date: new Date(tx.date),
      tradeDetails: tx.trade_details,
      cashbackAmount: tx.cashback_amount,
      userProfile: user
        ? { name: user.name, email: user.email, clientId: user.client_id }
        : undefined,
    };
  });
}
