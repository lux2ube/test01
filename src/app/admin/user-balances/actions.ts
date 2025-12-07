'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface UserBalance {
  userId: string;
  name: string;
  email: string;
  clientId: string;
  totalEarned: number;
  totalDeposit: number;
  totalWithdrawn: number;
  totalPendingWithdrawals: number;
  totalOrders: number;
  availableBalance: number;
}

export async function getUserBalances(): Promise<UserBalance[]> {
  const supabase = await createAdminClient();
  
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*');
  
  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
    return [];
  }
  
  const userIds = accounts?.map(acc => acc.user_id) || [];
  
  if (userIds.length === 0) {
    return [];
  }
  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, client_id')
    .in('id', userIds);
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return [];
  }
  
  const usersMap = new Map(users?.map(u => [u.id, u]) || []);
  
  const balances: UserBalance[] = [];
  
  for (const account of accounts || []) {
    const totalEarned = parseFloat(account.total_earned || '0');
    const totalDeposit = parseFloat(account.total_deposit || '0');
    const totalWithdrawn = parseFloat(account.total_withdrawn || '0');
    const totalPendingWithdrawals = parseFloat(account.total_pending_withdrawals || '0');
    const totalOrders = parseFloat(account.total_orders || '0');
    
    const availableBalance = totalEarned + totalDeposit - totalWithdrawn - totalPendingWithdrawals - totalOrders;
    
    if (availableBalance <= 0) {
      continue;
    }
    
    const user = usersMap.get(account.user_id);
    
    balances.push({
      userId: account.user_id,
      name: user?.name || 'غير معروف',
      email: user?.email || '',
      clientId: user?.client_id || '',
      totalEarned,
      totalDeposit,
      totalWithdrawn,
      totalPendingWithdrawals,
      totalOrders,
      availableBalance,
    });
  }
  
  balances.sort((a, b) => b.availableBalance - a.availableBalance);
  
  return balances;
}

export async function getTotalBalanceSummary(): Promise<{
  totalAvailable: number;
  totalEarned: number;
  totalDeposit: number;
  totalWithdrawn: number;
  totalPending: number;
  totalOrders: number;
  userCount: number;
}> {
  const balances = await getUserBalances();
  
  return {
    totalAvailable: balances.reduce((sum, b) => sum + b.availableBalance, 0),
    totalEarned: balances.reduce((sum, b) => sum + b.totalEarned, 0),
    totalDeposit: balances.reduce((sum, b) => sum + b.totalDeposit, 0),
    totalWithdrawn: balances.reduce((sum, b) => sum + b.totalWithdrawn, 0),
    totalPending: balances.reduce((sum, b) => sum + b.totalPendingWithdrawals, 0),
    totalOrders: balances.reduce((sum, b) => sum + b.totalOrders, 0),
    userCount: balances.length,
  };
}
