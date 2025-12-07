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
  productId?: string;
  referralSourceType?: 'cashback' | 'store_purchase' | 'all';
  withdrawalPaymentMethod?: string;
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
    product?: string;
    referralSourceType?: string;
    paymentMethod?: string;
  };
}

export interface DetailedRecord {
  id: string;
  date: string;
  amount: number;
  userName?: string;
  userEmail?: string;
  broker?: string;
  accountNumber?: string;
  productName?: string;
  status?: string;
  sourceType?: string;
  referredUserName?: string;
  paymentMethod?: string;
}

export interface DetailedReportResult {
  records: DetailedRecord[];
  total: number;
  count: number;
  recordType: string;
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

export async function getAvailableProducts(): Promise<FilterOption[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .order('name');
  
  if (error || !data) {
    console.error('Error fetching products:', error);
    return [];
  }
  
  return data.map(product => ({
    value: product.id,
    label: product.name,
  }));
}

export async function getReferralSourceTypes(): Promise<FilterOption[]> {
  return [
    { value: 'all', label: 'الكل' },
    { value: 'cashback', label: 'من الكاش باك' },
    { value: 'store_purchase', label: 'من المتجر' },
  ];
}

export async function getWithdrawalPaymentMethods(): Promise<FilterOption[]> {
  const supabase = await createAdminClient();
  
  const { data, error } = await supabase
    .from('withdrawals')
    .select('payment_method')
    .not('payment_method', 'is', null);
  
  if (error || !data) {
    console.error('Error fetching withdrawal payment methods:', error);
    return [];
  }
  
  const uniqueMethods = [...new Set(data.map(d => d.payment_method).filter(Boolean))];
  
  const options: FilterOption[] = [
    { value: 'all', label: 'الكل' },
    { value: 'admin_adjustment', label: 'تعديل إداري' },
  ];
  
  uniqueMethods
    .filter(m => m !== 'تعديل إداري')
    .sort()
    .forEach(method => {
      options.push({ value: method, label: method });
    });
  
  return options;
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
  
  if (filters.productId) {
    const { data: productData } = await supabase
      .from('products')
      .select('name')
      .eq('id', filters.productId)
      .single();
    if (productData) {
      appliedFilters.product = productData.name;
    }
  }
  
  if (filters.referralSourceType && filters.referralSourceType !== 'all') {
    appliedFilters.referralSourceType = filters.referralSourceType === 'cashback' ? 'من الكاش باك' : 'من المتجر';
  }
  
  if (filters.withdrawalPaymentMethod && filters.withdrawalPaymentMethod !== 'all') {
    if (filters.withdrawalPaymentMethod === 'admin_adjustment') {
      appliedFilters.paymentMethod = 'تعديل إداري';
    } else {
      appliedFilters.paymentMethod = filters.withdrawalPaymentMethod;
    }
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
      
      if (filters.broker || filters.accountId || (filters.referralSourceType && filters.referralSourceType !== 'all')) {
        filteredData = data.filter(tx => {
          const metadata = tx.metadata as Record<string, any> | null;
          
          if (filters.broker) {
            if (!metadata || metadata.broker !== filters.broker) {
              return false;
            }
          }
          
          if (filters.accountId) {
            if (!metadata || metadata.account_id !== filters.accountId) {
              return false;
            }
          }
          
          if (filters.referralSourceType && filters.referralSourceType !== 'all') {
            if (!metadata || metadata.source_type !== filters.referralSourceType) {
              return false;
            }
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
      .select('id, amount, user_id, requested_at, completed_at, payment_method')
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
    
    if (filters.withdrawalPaymentMethod && filters.withdrawalPaymentMethod !== 'all') {
      if (filters.withdrawalPaymentMethod === 'admin_adjustment') {
        query = query.eq('payment_method', 'تعديل إداري');
      } else {
        query = query.eq('payment_method', filters.withdrawalPaymentMethod);
      }
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'withdrawal_processing') {
    let query = supabase
      .from('withdrawals')
      .select('id, amount, user_id, requested_at, payment_method')
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
    
    if (filters.withdrawalPaymentMethod && filters.withdrawalPaymentMethod !== 'all') {
      if (filters.withdrawalPaymentMethod === 'admin_adjustment') {
        query = query.eq('payment_method', 'تعديل إداري');
      } else {
        query = query.eq('payment_method', filters.withdrawalPaymentMethod);
      }
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      count = data.length;
      total = data.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
    }
  } else if (filters.recordType === 'order_created') {
    let query = supabase
      .from('orders')
      .select('id, product_price, user_id, created_at, status, product_id');
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
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
      total = data.reduce((sum, order) => sum + parseFloat(order.product_price || '0'), 0);
    }
  }
  
  return {
    total,
    count,
    recordType: filters.recordType,
    appliedFilters,
  };
}

export async function getDetailedReport(filters: ReportFilters): Promise<DetailedReportResult> {
  const supabase = await createAdminClient();
  
  const records: DetailedRecord[] = [];
  let total = 0;
  
  if (filters.recordType === 'cashback') {
    let query = supabase
      .from('cashback_transactions')
      .select(`
        id, 
        cashback_amount, 
        date, 
        broker,
        user_id,
        account_id,
        users!cashback_transactions_user_id_fkey(name, email),
        trading_accounts!cashback_transactions_account_id_fkey(account_number)
      `)
      .order('date', { ascending: false });
    
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
      for (const tx of data) {
        const amount = parseFloat(tx.cashback_amount || '0');
        total += amount;
        const user = (tx as any).users;
        const account = (tx as any).trading_accounts;
        records.push({
          id: tx.id,
          date: tx.date,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
          broker: tx.broker,
          accountNumber: account?.account_number,
        });
      }
    }
  } else if (filters.recordType === 'referral') {
    let query = supabase
      .from('transactions')
      .select(`
        id, 
        amount, 
        created_at, 
        metadata,
        user_id,
        users!transactions_user_id_fkey(name, email)
      `)
      .eq('type', 'referral_commission')
      .order('created_at', { ascending: false });
    
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
      for (const tx of data) {
        const metadata = tx.metadata as Record<string, any> | null;
        
        if (filters.broker) {
          if (!metadata || metadata.broker !== filters.broker) {
            continue;
          }
        }
        
        if (filters.accountId) {
          if (!metadata || metadata.account_id !== filters.accountId) {
            continue;
          }
        }
        
        if (filters.referralSourceType && filters.referralSourceType !== 'all') {
          if (!metadata || metadata.source_type !== filters.referralSourceType) {
            continue;
          }
        }
        
        const amount = parseFloat(tx.amount || '0');
        total += amount;
        const user = (tx as any).users;
        records.push({
          id: tx.id,
          date: tx.created_at,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
          broker: metadata?.broker,
          accountNumber: metadata?.account_number,
          sourceType: metadata?.source_type === 'cashback' ? 'من الكاش باك' : metadata?.source_type === 'store_purchase' ? 'من المتجر' : undefined,
          referredUserName: metadata?.referred_user_name,
        });
      }
    }
  } else if (filters.recordType === 'deposit') {
    let query = supabase
      .from('transactions')
      .select(`
        id, 
        amount, 
        created_at,
        user_id,
        users!transactions_user_id_fkey(name, email)
      `)
      .eq('type', 'deposit')
      .order('created_at', { ascending: false });
    
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
      for (const tx of data) {
        const amount = parseFloat(tx.amount || '0');
        total += amount;
        const user = (tx as any).users;
        records.push({
          id: tx.id,
          date: tx.created_at,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
        });
      }
    }
  } else if (filters.recordType === 'withdrawal_completed') {
    let query = supabase
      .from('withdrawals')
      .select(`
        id, 
        amount, 
        requested_at, 
        completed_at,
        payment_method,
        user_id,
        users!withdrawals_user_id_fkey(name, email)
      `)
      .eq('status', 'Completed')
      .order('completed_at', { ascending: false });
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('completed_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('completed_at', filters.dateTo);
    }
    
    if (filters.withdrawalPaymentMethod && filters.withdrawalPaymentMethod !== 'all') {
      if (filters.withdrawalPaymentMethod === 'admin_adjustment') {
        query = query.eq('payment_method', 'تعديل إداري');
      } else {
        query = query.eq('payment_method', filters.withdrawalPaymentMethod);
      }
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      for (const tx of data) {
        const amount = parseFloat(tx.amount || '0');
        total += amount;
        const user = (tx as any).users;
        records.push({
          id: tx.id,
          date: tx.completed_at || tx.requested_at,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
          paymentMethod: tx.payment_method,
        });
      }
    }
  } else if (filters.recordType === 'withdrawal_processing') {
    let query = supabase
      .from('withdrawals')
      .select(`
        id, 
        amount, 
        requested_at,
        payment_method,
        user_id,
        users!withdrawals_user_id_fkey(name, email)
      `)
      .eq('status', 'Processing')
      .order('requested_at', { ascending: false });
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('requested_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('requested_at', filters.dateTo);
    }
    
    if (filters.withdrawalPaymentMethod && filters.withdrawalPaymentMethod !== 'all') {
      if (filters.withdrawalPaymentMethod === 'admin_adjustment') {
        query = query.eq('payment_method', 'تعديل إداري');
      } else {
        query = query.eq('payment_method', filters.withdrawalPaymentMethod);
      }
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      for (const tx of data) {
        const amount = parseFloat(tx.amount || '0');
        total += amount;
        const user = (tx as any).users;
        records.push({
          id: tx.id,
          date: tx.requested_at,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
          paymentMethod: tx.payment_method,
        });
      }
    }
  } else if (filters.recordType === 'order_created') {
    let query = supabase
      .from('orders')
      .select(`
        id, 
        product_price, 
        created_at, 
        status,
        user_id,
        product_id,
        users!orders_user_id_fkey(name, email),
        products!orders_product_id_fkey(name)
      `)
      .order('created_at', { ascending: false });
    
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    
    if (filters.productId) {
      query = query.eq('product_id', filters.productId);
    }
    
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    
    const { data, error } = await query;
    
    if (!error && data) {
      for (const order of data) {
        const amount = parseFloat(order.product_price || '0');
        total += amount;
        const user = (order as any).users;
        const product = (order as any).products;
        records.push({
          id: order.id,
          date: order.created_at,
          amount,
          userName: user?.name || undefined,
          userEmail: user?.email,
          productName: product?.name,
          status: order.status,
        });
      }
    }
  }
  
  return {
    records,
    total,
    count: records.length,
    recordType: filters.recordType,
  };
}
