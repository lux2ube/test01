import { supabaseAdmin, DatabaseError } from './database';
import { Account, AvailableBalance } from '@/types/ledger';

export async function getAvailableBalance(userId: string): Promise<AvailableBalance> {
  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new DatabaseError(`Failed to fetch account for user ${userId}`, error.code, error);
  }

  if (!account) {
    throw new DatabaseError(`No account found for user ${userId}`);
  }

  const available_balance = 
    parseFloat(account.total_earned) -
    parseFloat(account.total_withdrawn) -
    parseFloat(account.total_pending_withdrawals) -
    parseFloat(account.total_orders);

  return {
    user_id: userId,
    total_earned: parseFloat(account.total_earned),
    total_withdrawn: parseFloat(account.total_withdrawn),
    total_pending_withdrawals: parseFloat(account.total_pending_withdrawals),
    total_orders: parseFloat(account.total_orders),
    available_balance: Math.max(0, available_balance)
  };
}

export async function getAccount(userId: string): Promise<Account> {
  const { data: account, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new DatabaseError(`Failed to fetch account for user ${userId}`, error.code, error);
  }

  if (!account) {
    throw new DatabaseError(`No account found for user ${userId}`);
  }

  return {
    ...account,
    total_earned: parseFloat(account.total_earned),
    total_withdrawn: parseFloat(account.total_withdrawn),
    total_pending_withdrawals: parseFloat(account.total_pending_withdrawals),
    total_orders: parseFloat(account.total_orders)
  };
}
