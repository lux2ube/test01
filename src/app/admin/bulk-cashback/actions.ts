'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { TradingAccount } from '@/types';
import { addCashbackTransaction } from '../manage-cashback/actions';

export interface BulkCashbackRecord {
  id: string;
  accountNumber: string;
  cashbackAmount: number;
  note: string;
  userId: string;
  accountId: string;
  broker: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'error';
  reason?: string;
}

export interface RecentCashback {
  accountId: string;
  accountNumber: string;
  cashbackAmount: number;
  date: Date;
}

export async function getRecentCashbackTransactions(): Promise<RecentCashback[]> {
  const supabase = await createAdminClient();
  
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  const { data, error } = await supabase
    .from('cashback_transactions')
    .select('account_id, account_number, cashback_amount, date')
    .gte('date', twentyFourHoursAgo.toISOString());
  
  if (error) {
    console.error('Error fetching recent cashback transactions:', error);
    return [];
  }
  
  return (data || []).map((tx) => ({
    accountId: tx.account_id,
    accountNumber: tx.account_number,
    cashbackAmount: tx.cashback_amount,
    date: new Date(tx.date),
  }));
}

export async function checkDuplicateInLast24Hours(
  accountId: string, 
  accountNumber: string, 
  cashbackAmount: number
): Promise<boolean> {
  const supabase = await createAdminClient();
  
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  const { data, error } = await supabase
    .from('cashback_transactions')
    .select('id')
    .eq('account_number', accountNumber)
    .eq('cashback_amount', cashbackAmount)
    .gte('date', twentyFourHoursAgo.toISOString())
    .limit(1);
  
  if (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
  
  return (data && data.length > 0);
}

export async function confirmSingleCashback(record: BulkCashbackRecord): Promise<{ success: boolean; message: string }> {
  if (record.status !== 'pending') {
    return { success: false, message: 'Record is not in pending status' };
  }

  if (!record.userId || !record.accountId || !record.broker) {
    return { success: false, message: 'Missing required account information' };
  }

  const isDuplicate = await checkDuplicateInLast24Hours(
    record.accountId,
    record.accountNumber,
    record.cashbackAmount
  );
  
  if (isDuplicate) {
    return { 
      success: false, 
      message: 'سجل مكرر: نفس الحساب والمبلغ موجود خلال 24 ساعة الماضية' 
    };
  }

  try {
    const result = await addCashbackTransaction({
      userId: record.userId,
      accountId: record.accountId,
      accountNumber: record.accountNumber,
      broker: record.broker,
      tradeDetails: record.note || 'Bulk import',
      cashbackAmount: record.cashbackAmount,
    });

    if (result.success) {
      return { success: true, message: 'تمت إضافة الكاش باك بنجاح' };
    } else {
      return { success: false, message: result.message || 'فشل إضافة الكاش باك' };
    }
  } catch (error) {
    console.error('Error confirming cashback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: errorMessage };
  }
}

export async function getApprovedAccounts(): Promise<TradingAccount[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('trading_accounts')
    .select('*')
    .eq('status', 'Approved');

  if (error) {
    console.error('Error fetching approved accounts:', error);
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
