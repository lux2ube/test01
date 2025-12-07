'use server';

import { createAdminClient } from '@/lib/supabase/server';

export interface FilterOption {
  value: string;
  label: string;
}

export interface ReportFilters {
  recordType: string;
  userId?: string;
  broker?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilteredReportResult {
  total: number;
  count: number;
  recordType: string;
  appliedFilters: {
    user?: string;
    broker?: string;
    account?: string;
    period?: string;
  };
}

export async function getAvailableRecordTypes(): Promise<FilterOption[]> {
  return [
    { value: 'cashback', label: 'الكاش باك' },
    { value: 'referral', label: 'عمولات الإحالة' },
    { value: 'deposit', label: 'الإيداعات' },
    { value: 'withdrawal_completed', label: 'السحوبات المكتملة' },
    { value: 'withdrawal_processing', label: 'السحوبات قيد المعالجة' },
    { value: 'order_created', label: 'الطلبات (المتجر)' },
  ];
}

export async function getAvailableUsers(): Promise<FilterOption[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, client_id')
    .order('name');
  
  if (error || !data) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data.map(user => ({
    value: user.id,
    label: `${user.name || user.email} ${user.client_id ? `(${user.client_id})` : ''}`.trim(),
  }));
}

export async function getAvailableBrokers(userId?: string): Promise<FilterOption[]> {
  const supabase = await createAdminClient();
  
  let query = supabase
    .from('trading_accounts')
    .select('broker')
    .eq('status', 'Approved');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error('Error fetching brokers:', error);
    return [];
  }
  
  const uniqueBrokers = [...new Set(data.map(d => d.broker).filter(Boolean))];
  
  return uniqueBrokers.sort().map(broker => ({
    value: broker,
    label: broker,
  }));
}

export async function getAvailableAccounts(userId?: string, broker?: string): Promise<FilterOption[]> {
  const supabase = await createAdminClient();
  
  let query = supabase
    .from('trading_accounts')
    .select('id, account_number, broker')
    .eq('status', 'Approved');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (broker) {
    query = query.eq('broker', broker);
  }
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error('Error fetching accounts:', error);
    return [];
  }
  
  return data.map(account => ({
    value: account.id,
    label: `${account.account_number} (${account.broker})`,
  }));
}

export async function getFilteredReport(filters: ReportFilters): Promise<FilteredReportResult> {
  const supabase = await createAdminClient();
  
  let total = 0;
  let count = 0;
  const appliedFilters: FilteredReportResult['appliedFilters'] = {};
  
  if (filters.userId) {
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', filters.userId)
      .single();
    if (userData) {
      appliedFilters.user = userData.name || userData.email;
    }
  }
  
  if (filters.broker) {
    appliedFilters.broker = filters.broker;
  }
  
  if (filters.accountId) {
    const { data: accountData } = await supabase
      .from('trading_accounts')
      .select('account_number')
      .eq('id', filters.accountId)
      .single();
    if (accountData) {
      appliedFilters.account = accountData.account_number;
    }
  }
  
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom || 'البداية';
    const to = filters.dateTo || 'الآن';
    appliedFilters.period = `${from} إلى ${to}`;
  }
  
  if (filters.recordType === 'cashback') {
    let query = supabase
      .from('cashback_transactions')
      .select('id, cashback_amount, user_id, account_id, broker, date');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.broker) {
      query = query.eq('broker', filters.broker);
    }
    
    if (filters.accountId) {
      query = query.eq('account_id', filters.accountId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.cashback_amount || '0'), 0);
    }
  } else if (filters.recordType === 'referral') {
    let query = supabase
      .from('transactions')
      .select('id, amount, user_id, created_at, metadata')
      .eq('type', 'referral_commission');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      let filteredData = data;
      
      if (filters.broker || filters.accountId) {
        filteredData = data.filter(tx => {
          const metadata = tx.metadata as Record<string, any> | null;
          if (!metadata) return false;
          
          if (filters.broker && metadata.broker !== filters.broker) {
            return false;
          }
          
          if (filters.accountId && metadata.account_id !== filters.accountId) {
            return false;
          }
          
          return true;
        });
      }
      
      count = filteredData.length;
      total = filteredData.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'deposit') {
    let query = supabase
      .from('transactions')
      .select('id, amount, user_id, created_at')
      .eq('type', 'deposit');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'withdrawal_completed') {
    let query = supabase
      .from('withdrawals')
      .select('id, amount, user_id, requested_at, completed_at')
      .eq('status', 'Completed');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('completed_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('completed_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'withdrawal_processing') {
    let query = supabase
      .from('withdrawals')
      .select('id, amount, user_id, requested_at')
      .eq('status', 'Processing');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('requested_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('requested_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'order_created') {
    let query = supabase
      .from('orders')
      .select('id, price, user_id, created_at, status');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, order) => sum + parseFloat(order.price || '0'), 0);
    }
  }
  
  return {
    total,
    count,
    recordType: filters.recordType,
    appliedFilters,
  };
}
