import { supabaseAdmin, DatabaseError } from './database';
import { TransactionResult, Transaction, ImmutableEvent, AuditLog } from '@/types/ledger';

interface AddCashbackParams {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function addCashback(params: AddCashbackParams): Promise<TransactionResult> {
  const { userId, amount, referenceId, metadata, ipAddress, userAgent } = params;

  if (amount <= 0) {
    throw new DatabaseError('Cashback amount must be positive');
  }

  const { data, error } = await supabaseAdmin.rpc('add_cashback_transaction', {
    p_user_id: userId,
    p_amount: amount,
    p_reference_id: referenceId,
    p_metadata: metadata || {},
    p_ip_address: ipAddress,
    p_user_agent: userAgent
  });

  if (error) {
    throw new DatabaseError('Failed to add cashback', error.code, error);
  }

  return data;
}

export async function addCashbackDirect(params: AddCashbackParams): Promise<TransactionResult> {
  const { userId, amount, referenceId, metadata, ipAddress, userAgent } = params;

  if (amount <= 0) {
    throw new DatabaseError('Cashback amount must be positive');
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
        type: 'cashback',
        amount: amount,
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
        event_type: 'CASHBACK_ADDED',
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
        total_earned: (parseFloat(accountBefore?.total_earned || '0') + amount).toFixed(2)
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
        action: 'CASHBACK_ADDED',
        resource_type: 'cashback_transactions',
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
    throw new DatabaseError('Failed to add cashback transaction', undefined, error);
  }
}
