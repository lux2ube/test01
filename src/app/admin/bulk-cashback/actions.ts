'use server';

import { createAdminClient } from '@/lib/supabase/server';
import type { TradingAccount } from '@/types';
import { addCashbackTransaction } from '../manage-cashback/actions';

export async function processBulkCashback(validatedData: { accountNumber: string, cashbackAmount: number, note: string, userId: string, accountId: string, broker: string }[]) {
  if (validatedData.length === 0) {
    return { success: false, message: "No valid rows to process." };
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const data of validatedData) {
    try {
      const result = await addCashbackTransaction({
        userId: data.userId,
        accountId: data.accountId,
        accountNumber: data.accountNumber,
        broker: data.broker,
        tradeDetails: data.note,
        cashbackAmount: data.cashbackAmount,
      });

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push(`Account ${data.accountNumber}: ${result.message}`);
      }
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Account ${data.accountNumber}: ${errorMessage}`);
      console.error(`Failed to process cashback for account ${data.accountNumber}:`, error);
    }
  }
  
  let message = `Processing complete. Successfully added ${successCount} transactions.`;
  if (errorCount > 0) {
    message += ` ${errorCount} failed.`;
  }
  
  return { 
    success: errorCount === 0, 
    message: message,
    errors: errors,
  };
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
