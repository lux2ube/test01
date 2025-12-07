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

export async function confirmSingleCashback(record: BulkCashbackRecord): Promise<{ success: boolean; message: string }> {
  if (record.status !== 'pending') {
    return { success: false, message: 'Record is not in pending status' };
  }

  if (!record.userId || !record.accountId || !record.broker) {
    return { success: false, message: 'Missing required account information' };
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
