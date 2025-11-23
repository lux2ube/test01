/**
 * Financial-Grade Ledger Service
 * 
 * All operations are ACID-compliant and use database stored procedures
 * to ensure data integrity across accounts, transactions, events, and audit logs.
 * 
 * SECURITY: All functions require service role authentication
 */

import { createClient } from '@supabase/supabase-js';
import type {
  Account,
  Transaction,
  ImmutableEvent,
  AuditLog,
  AvailableBalance,
  TransactionResult,
} from '@/types/ledger';

// Create Supabase client with service role for backend operations
const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// ==================================================
// Balance Calculation
// ==================================================

/**
 * Get available balance for a user
 * Formula: total_earned - total_withdrawn - total_pending_withdrawals - total_orders
 */
export async function getAvailableBalance(userId: string): Promise<AvailableBalance> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get account: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Account not found for user ${userId}`);
  }

  const available_balance = 
    data.total_earned - 
    data.total_withdrawn - 
    data.total_pending_withdrawals - 
    data.total_orders;

  return {
    user_id: userId,
    total_earned: parseFloat(data.total_earned),
    total_withdrawn: parseFloat(data.total_withdrawn),
    total_pending_withdrawals: parseFloat(data.total_pending_withdrawals),
    total_orders: parseFloat(data.total_orders),
    available_balance: parseFloat(available_balance.toString()),
  };
}

// ==================================================
// Cashback Operations
// ==================================================

export interface AddCashbackParams {
  userId: string;
  amount: number;
  referenceId: string; // ID from cashback_transactions table
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Add cashback to user's account
 * Increases total_earned
 */
export async function addCashback(params: AddCashbackParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_add_cashback', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_id: params.referenceId,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to add cashback: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_add_cashback');
  }

  const result = data[0];

  // Fetch the created records
  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

// ==================================================
// Referral Commission Operations
// ==================================================

export interface AddReferralParams {
  userId: string;
  amount: number;
  referenceId: string; // ID from referral_commissions table
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Add referral commission to user's account
 * Increases total_earned
 */
export async function addReferralCommission(params: AddReferralParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_add_referral', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_id: params.referenceId,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to add referral: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_add_referral');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

// ==================================================
// Withdrawal Operations
// ==================================================

export interface CreateWithdrawalParams {
  userId: string;
  amount: number;
  referenceId: string; // ID from withdrawals table
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a withdrawal (sets status to processing)
 * Increases total_pending_withdrawals
 * Checks available balance before processing
 */
export async function createWithdrawal(params: CreateWithdrawalParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_create_withdrawal', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_id: params.referenceId,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to create withdrawal: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_create_withdrawal');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

export interface ChangeWithdrawalStatusParams {
  userId: string;
  referenceId: string;
  oldStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Change withdrawal status
 * processing → completed: Decreases total_pending_withdrawals, increases total_withdrawn
 * processing → cancelled: Decreases total_pending_withdrawals
 */
export async function changeWithdrawalStatus(params: ChangeWithdrawalStatusParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_change_withdrawal_status', {
    p_user_id: params.userId,
    p_reference_id: params.referenceId,
    p_old_status: params.oldStatus,
    p_new_status: params.newStatus,
    p_amount: params.amount,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to change withdrawal status: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_change_withdrawal_status');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

/**
 * Reverse a referral commission
 * Decreases total_earned
 * Checks that user has enough earned balance before reversing
 */
export async function reverseReferralCommission(params: AddReferralParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_reverse_referral', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_id: params.referenceId,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to reverse referral: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_reverse_referral');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

// ==================================================
// Order Operations
// ==================================================

export interface CreateOrderParams {
  userId: string;
  amount: number;
  referenceId: string; // ID from orders table
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an order
 * Increases total_orders
 * Checks available balance before processing
 */
export async function createOrder(params: CreateOrderParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_create_order', {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_reference_id: params.referenceId,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_create_order');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

export interface ChangeOrderStatusParams {
  userId: string;
  referenceId: string;
  oldStatus: string;
  newStatus: string;
  amount: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Change order status
 * cancelled: Decreases total_orders (returns funds to available balance)
 */
export async function changeOrderStatus(params: ChangeOrderStatusParams): Promise<TransactionResult> {
  const supabase = getServiceClient();

  const { data, error } = await supabase.rpc('ledger_change_order_status', {
    p_user_id: params.userId,
    p_reference_id: params.referenceId,
    p_old_status: params.oldStatus,
    p_new_status: params.newStatus,
    p_amount: params.amount,
    p_metadata: params.metadata || {},
    p_ip_address: params.ipAddress || null,
    p_user_agent: params.userAgent || null,
  });

  if (error) {
    throw new Error(`Failed to change order status: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No data returned from ledger_change_order_status');
  }

  const result = data[0];

  const [transaction, event, audit, account] = await Promise.all([
    supabase.from('transactions').select('*').eq('id', result.transaction_id).single(),
    supabase.from('immutable_events').select('*').eq('id', result.event_id).single(),
    supabase.from('audit_logs').select('*').eq('id', result.audit_id).single(),
    supabase.from('accounts').select('*').eq('user_id', params.userId).single(),
  ]);

  if (transaction.error || event.error || audit.error || account.error) {
    throw new Error('Failed to fetch created records');
  }

  return {
    transaction: transaction.data as Transaction,
    event: event.data as ImmutableEvent,
    audit_log: audit.data as AuditLog,
    updated_account: account.data as Account,
  };
}

// ==================================================
// Query Functions
// ==================================================

/**
 * Get user's transaction history
 */
export async function getUserTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }
): Promise<Transaction[]> {
  const supabase = getServiceClient();

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get transactions: ${error.message}`);
  }

  return (data || []) as Transaction[];
}

/**
 * Get user's account
 */
export async function getUserAccount(userId: string): Promise<Account> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get account: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Account not found for user ${userId}`);
  }

  return data as Account;
}
