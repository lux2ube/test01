import * as ledgerService from './service';
import type { TransactionResult } from '@/types/ledger';

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
  return ledgerService.addReferralCommission(params);
}

export async function reverseReferralCommission(params: ReverseReferralCommissionParams): Promise<TransactionResult> {
  const { reason, ...rest } = params;
  return ledgerService.reverseReferralCommission({
    ...rest,
    metadata: {
      ...(params.metadata || {}),
      reason,
    },
  });
}
