export type TransactionType =
  | 'cashback'
  | 'referral'
  | 'referral_reversed'
  | 'deposit'
  | 'withdrawal_completed'
  | 'withdrawal_processing'
  | 'withdrawal_cancelled'
  | 'order_created'
  | 'order_cancelled';

export interface Account {
  id: string;
  user_id: string;
  total_earned: number;
  total_deposit: number;
  total_withdrawn: number;
  total_pending_withdrawals: number;
  total_orders: number;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

export interface ImmutableEvent {
  id: string;
  transaction_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AvailableBalance {
  user_id: string;
  total_earned: number;
  total_deposit: number;
  total_withdrawn: number;
  total_pending_withdrawals: number;
  total_orders: number;
  available_balance: number;
}

export interface TransactionResult {
  transaction: Transaction;
  event: ImmutableEvent;
  audit_log: AuditLog;
  updated_account: Account;
}
