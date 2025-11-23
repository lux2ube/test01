import * as ledgerService from './service';
import type { TransactionResult } from '@/types/ledger';

interface AddCashbackParams {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function addCashback(params: AddCashbackParams): Promise<TransactionResult> {
  return ledgerService.addCashback(params);
}

export async function addCashbackDirect(params: AddCashbackParams): Promise<TransactionResult> {
  return ledgerService.addCashback(params);
}
