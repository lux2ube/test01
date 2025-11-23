import * as ledgerService from './service';
import type { TransactionResult } from '@/types/ledger';

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
  return ledgerService.createOrder(params);
}

export async function changeOrderStatus(params: ChangeOrderStatusParams): Promise<TransactionResult> {
  return ledgerService.changeOrderStatus(params);
}

export { getAvailableBalance } from './service';
export { InsufficientBalanceError } from './database';
