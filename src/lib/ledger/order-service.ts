import { supabaseAdmin, DatabaseError, InsufficientBalanceError } from './database';
import { TransactionResult, Transaction, ImmutableEvent, AuditLog } from '@/types/ledger';
import { getAvailableBalance } from './balance-service';

interface CreateOrderParams {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface ChangeOrderStatusParams {
  userId: string;
  referenceId: string;
  oldStatus: string;
  newStatus: string;
  amount: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<TransactionResult> {
  const { userId, amount, referenceId, metadata, ipAddress, userAgent } = params;

  if (amount <= 0) {
    throw new DatabaseError('Order amount must be positive');
  }

  const balance = await getAvailableBalance(userId);
  if (balance.available_balance < amount) {
    throw new InsufficientBalanceError(
      `Insufficient balance for order. Available: ${balance.available_balance}, Required: ${amount}`
    );
  }

  let transaction: Transaction;
  let event: ImmutableEvent;
  let auditLog: AuditLog;
  let updatedAccount;

  try {
    const { data: txData, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'order_created',
        amount: -amount,
        reference_id: referenceId,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (txError) throw new DatabaseError('Failed to create transaction', txError.code, txError);
    transaction = txData;

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('immutable_events')
      .insert({
        transaction_id: transaction.id,
        event_type: 'ORDER_CREATED',
        event_data: {
          user_id: userId,
          amount,
          reference_id: referenceId,
          metadata
        }
      })
      .select()
      .single();

    if (eventError) throw new DatabaseError('Failed to create event', eventError.code, eventError);
    event = eventData;

    const { data: accountBefore } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .update({
        total_orders: (parseFloat(accountBefore?.total_orders || '0') + amount).toFixed(2)
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (accountError) throw new DatabaseError('Failed to update account', accountError.code, accountError);
    updatedAccount = accountData;

    const { data: logData, error: logError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'ORDER_CREATED',
        resource_type: 'orders',
        resource_id: referenceId,
        before: accountBefore,
        after: accountData,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (logError) throw new DatabaseError('Failed to create audit log', logError.code, logError);
    auditLog = logData;

    return {
      transaction,
      event,
      audit_log: auditLog,
      updated_account: updatedAccount
    };
  } catch (error) {
    if (error instanceof InsufficientBalanceError) throw error;
    throw new DatabaseError('Failed to create order', undefined, error);
  }
}

export async function changeOrderStatus(params: ChangeOrderStatusParams): Promise<TransactionResult> {
  const { userId, referenceId, oldStatus, newStatus, amount, metadata, ipAddress, userAgent } = params;

  if (oldStatus === newStatus) {
    throw new DatabaseError('Old status and new status cannot be the same');
  }

  let transaction: Transaction;
  let event: ImmutableEvent;
  let auditLog: AuditLog;
  let updatedAccount;

  try {
    const wasCancelled = oldStatus !== 'cancelled' && newStatus === 'cancelled';
    const wasUncancelled = oldStatus === 'cancelled' && newStatus !== 'cancelled';

    const transactionType = wasCancelled ? 'order_cancelled' : 'order_created';

    const { data: txData, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: transactionType,
        amount: 0,
        reference_id: referenceId,
        metadata: { ...metadata, old_status: oldStatus, new_status: newStatus }
      })
      .select()
      .single();

    if (txError) throw new DatabaseError('Failed to create status change transaction', txError.code, txError);
    transaction = txData;

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('immutable_events')
      .insert({
        transaction_id: transaction.id,
        event_type: 'ORDER_STATUS_CHANGED',
        event_data: {
          user_id: userId,
          reference_id: referenceId,
          old_status: oldStatus,
          new_status: newStatus,
          amount,
          metadata
        }
      })
      .select()
      .single();

    if (eventError) throw new DatabaseError('Failed to create event', eventError.code, eventError);
    event = eventData;

    const { data: accountBefore } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .single();

    let accountUpdate: any = {};

    if (wasCancelled) {
      accountUpdate = {
        total_orders: Math.max(0, parseFloat(accountBefore?.total_orders || '0') - amount).toFixed(2)
      };
    } else if (wasUncancelled) {
      const balance = await getAvailableBalance(userId);
      if (balance.available_balance < amount) {
        throw new InsufficientBalanceError(
          `Insufficient balance to reactivate order. Available: ${balance.available_balance}, Required: ${amount}`
        );
      }
      accountUpdate = {
        total_orders: (parseFloat(accountBefore?.total_orders || '0') + amount).toFixed(2)
      };
    }

    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .update(accountUpdate)
      .eq('user_id', userId)
      .select()
      .single();

    if (accountError) throw new DatabaseError('Failed to update account', accountError.code, accountError);
    updatedAccount = accountData;

    const { data: logData, error: logError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'ORDER_STATUS_CHANGED',
        resource_type: 'orders',
        resource_id: referenceId,
        before: accountBefore,
        after: accountData,
        ip_address: ipAddress,
        user_agent: userAgent
      })
      .select()
      .single();

    if (logError) throw new DatabaseError('Failed to create audit log', logError.code, logError);
    auditLog = logData;

    return {
      transaction,
      event,
      audit_log: auditLog,
      updated_account: updatedAccount
    };
  } catch (error) {
    if (error instanceof InsufficientBalanceError) throw error;
    throw new DatabaseError('Failed to change order status', undefined, error);
  }
}
