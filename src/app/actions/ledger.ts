'use server';

/**
 * Ledger Server Actions
 * 
 * Secure server-side actions for ledger operations
 * All functions require authentication and use the ledger service layer
 */

import { getSession } from '@/lib/auth/session';
import * as ledgerService from '@/lib/ledger/service';
import type { AvailableBalance, Transaction } from '@/types/ledger';
import { headers } from 'next/headers';

/**
 * Get client IP address from request headers
 */
async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIp || undefined;
}

/**
 * Get user agent from request headers
 */
async function getUserAgent(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('user-agent') || undefined;
}

// ==================================================
// Public Actions (User-facing)
// ==================================================

/**
 * Get current user's available balance
 */
export async function getMyBalance(): Promise<{ success: true; balance: AvailableBalance } | { success: false; error: string }> {
  try {
    const session = await getSession();
    
    if (!session.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const balance = await ledgerService.getAvailableBalance(session.userId);

    return { success: true, balance };
  } catch (error) {
    console.error('Failed to get balance:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get balance' 
    };
  }
}

/**
 * Get current user's transaction history
 */
export async function getMyTransactions(
  options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }
): Promise<{ success: true; transactions: Transaction[] } | { success: false; error: string }> {
  try {
    const session = await getSession();
    
    if (!session.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const transactions = await ledgerService.getUserTransactions(session.userId, options);

    return { success: true, transactions };
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get transactions' 
    };
  }
}

/**
 * Get current user's account details
 */
export async function getMyAccount() {
  try {
    const session = await getSession();
    
    if (!session.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const account = await ledgerService.getUserAccount(session.userId);

    return { success: true, account };
  } catch (error) {
    console.error('Failed to get account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get account' 
    };
  }
}

// ==================================================
// Backend Actions (Admin/System use only)
// ==================================================
// These should ONLY be called from backend workflows, not directly from the client

/**
 * Add cashback to a user's account
 * BACKEND USE ONLY - Called when cashback is calculated from trades
 */
export async function addCashbackToLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.addCashback({
      userId,
      amount,
      referenceId,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to add cashback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add cashback' 
    };
  }
}

/**
 * Add referral commission to a user's account
 * BACKEND USE ONLY - Called when referral earns commission
 */
export async function addReferralCommissionToLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.addReferralCommission({
      userId,
      amount,
      referenceId,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to add referral commission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add referral commission' 
    };
  }
}

/**
 * Reverse a referral commission
 * BACKEND USE ONLY - Called when referral is reversed/cancelled
 */
export async function reverseReferralCommissionInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.reverseReferralCommission({
      userId,
      amount,
      referenceId,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to reverse referral commission:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reverse referral commission' 
    };
  }
}

/**
 * Create a withdrawal in the ledger
 * BACKEND USE ONLY - Called when withdrawal is submitted
 */
export async function createWithdrawalInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.createWithdrawal({
      userId,
      amount,
      referenceId,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to create withdrawal:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create withdrawal' 
    };
  }
}

/**
 * Change withdrawal status in the ledger
 * BACKEND USE ONLY - Called when admin approves/rejects withdrawal
 */
export async function changeWithdrawalStatusInLedger(
  userId: string,
  referenceId: string,
  oldStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
  amount: number,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.changeWithdrawalStatus({
      userId,
      referenceId,
      oldStatus,
      newStatus,
      amount,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to change withdrawal status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to change withdrawal status' 
    };
  }
}

/**
 * Create an order in the ledger
 * BACKEND USE ONLY - Called when order is placed from store
 */
export async function createOrderInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.createOrder({
      userId,
      amount,
      referenceId,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to create order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    };
  }
}

/**
 * Change order status in the ledger
 * BACKEND USE ONLY - Called when order is cancelled
 */
export async function changeOrderStatusInLedger(
  userId: string,
  referenceId: string,
  oldStatus: string,
  newStatus: string,
  amount: number,
  metadata?: Record<string, any>
) {
  try {
    const result = await ledgerService.changeOrderStatus({
      userId,
      referenceId,
      oldStatus,
      newStatus,
      amount,
      metadata,
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    return { success: true, result };
  } catch (error) {
    console.error('Failed to change order status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to change order status' 
    };
  }
}
