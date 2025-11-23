import * as ledgerService from './service';
import type { TransactionResult } from '@/types/ledger';

interface CreateWithdrawalParams {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface ChangeWithdrawalStatusParams {
  userId: string;
  referenceId: string;
  oldStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createWithdrawal(params: CreateWithdrawalParams): Promise<TransactionResult> {
  return ledgerService.createWithdrawal(params);
}

export async function changeWithdrawalStatus(params: ChangeWithdrawalStatusParams): Promise<TransactionResult> {
  return ledgerService.changeWithdrawalStatus(params);
}

export { getAvailableBalance } from './service';
export { InsufficientBalanceError } from './database';
