import { supabaseAdmin, DatabaseError } from './database';
import { TransactionResult, Transaction, ImmutableEvent, AuditLog } from '@/types/ledger';

interface AddReferralCommissionParams {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface ReverseReferralCommissionParams {
  userId: string;
  amount: number;
  referenceId: string;
  reason: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function addReferralCommission(params: AddReferralCommissionParams): Promise<TransactionResult> {
  const { userId, amount, referenceId, metadata, ipAddress, userAgent } = params;

  if (amount <= 0) {
    throw new DatabaseError('Referral commission amount must be positive');
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
        type: 'referral',
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
        event_type: 'REFERRAL_COMMISSION_ADDED',
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
        action: 'REFERRAL_COMMISSION_ADDED',
        resource_type: 'referral_commissions',
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
    throw new DatabaseError('Failed to add referral commission', undefined, error);
  }
}

export async function reverseReferralCommission(params: ReverseReferralCommissionParams): Promise<TransactionResult> {
  const { userId, amount, referenceId, reason, metadata, ipAddress, userAgent } = params;

  if (amount <= 0) {
    throw new DatabaseError('Reversal amount must be positive');
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
        type: 'referral_reversed',
        amount: -amount,
        reference_id: referenceId,
        metadata: { ...metadata, reason }
      })
      .select()
      .single();

    if (txError) throw new DatabaseError('Failed to create reversal transaction', txError.code, txError);
    transaction = txData;

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('immutable_events')
      .insert({
        transaction_id: transaction.id,
        event_type: 'REFERRAL_COMMISSION_REVERSED',
        event_data: {
          user_id: userId,
          amount,
          reference_id: referenceId,
          reason,
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

    const newTotalEarned = Math.max(0, parseFloat(accountBefore?.total_earned || '0') - amount);

    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .update({
        total_earned: newTotalEarned.toFixed(2)
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
        action: 'REFERRAL_COMMISSION_REVERSED',
        resource_type: 'referral_commissions',
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
    throw new DatabaseError('Failed to reverse referral commission', undefined, error);
  }
}
