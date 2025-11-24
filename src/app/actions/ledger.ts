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
// CRITICAL SECURITY: These functions are for server-side/admin use ONLY
// They should NEVER be exported or called from client components
// Only backend cron jobs, admin actions, or trusted server code should use these

/**
 * INTERNAL USE ONLY - Verify the caller has admin privileges
 * This prevents unauthorized users from manipulating balances
 * 
 * SECURITY: Checks if the user has 'admin' role in the users table
 * Uses Supabase service role to bypass RLS and verify admin status
 * 
 * REQUIRED ENV VAR: SUPABASE_SERVICE_ROLE_KEY must be set in production
 * 
 * @returns Object with isAdmin flag and userId if authorized
 */
async function verifyAdminOrServiceRole(): Promise<{ isAdmin: boolean; userId: string | null }> {
  const session = await getSession();
  
  if (!session.userId) {
    return { isAdmin: false, userId: null };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Primary path: Use service role key (bypasses RLS, works reliably)
  if (serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.userId)
      .single();
    
    if (error) {
      console.error('Failed to verify admin role:', error.message);
      return { isAdmin: false, userId: null };
    }

    const isAdmin = user?.role === 'admin';
    return { isAdmin, userId: isAdmin ? session.userId : null };
  }

  // Fallback path: Try using user's access token (when service key unavailable)
  if (session.access_token) {
    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      }
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.userId)
      .single();
    
    if (error) {
      console.error('Failed to verify admin role via access token:', error.message);
      return { isAdmin: false, userId: null };
    }

    const isAdmin = user?.role === 'admin';
    return { isAdmin, userId: isAdmin ? session.userId : null };
  }

  // Configuration error: Neither service key nor access token available
  console.error(
    'CONFIGURATION ERROR: Cannot verify admin role. ' +
    'SUPABASE_SERVICE_ROLE_KEY is not set and session has no access_token. ' +
    'Please set SUPABASE_SERVICE_ROLE_KEY environment variable.'
  );
  return { isAdmin: false, userId: null };
}

/**
 * Add cashback to a user's account
 * ADMIN/BACKEND USE ONLY - Called when cashback is calculated from trades
 * SECURITY: Requires admin privileges or service role
 */
export async function addCashbackToLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  console.log('🟡 [ACTION] addCashbackToLedger called:', { userId, amount, referenceId });
  
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  console.log('🟡 [ACTION] Admin verification result:', { isAdmin: auth.isAdmin, userId: auth.userId });
  
  if (!auth.isAdmin || !auth.userId) {
    console.error('🔴 [ACTION] Unauthorized: Not admin');
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    console.log('🟡 [ACTION] Calling ledgerService.addCashback');
    const result = await ledgerService.addCashback({
      userId,
      amount,
      referenceId,
      // Include admin actor in metadata for audit trail
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_add_cashback',
      },
      ipAddress: await getClientIp(),
      userAgent: await getUserAgent(),
    });

    console.log('🟢 [ACTION] Ledger service returned success');
    return { success: true, result };
  } catch (error) {
    console.error('🔴 [ACTION] Failed to add cashback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add cashback' 
    };
  }
}

/**
 * Add referral commission to a user's account
 * ADMIN/BACKEND USE ONLY - Called when referral earns commission
 * SECURITY: Requires admin privileges or service role
 */
export async function addReferralCommissionToLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.addReferralCommission({
      userId,
      amount,
      referenceId,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_add_referral_commission',
      },
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
 * ADMIN/BACKEND USE ONLY - Called when referral is reversed/cancelled
 * SECURITY: Requires admin privileges or service role
 */
export async function reverseReferralCommissionInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.reverseReferralCommission({
      userId,
      amount,
      referenceId,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_reverse_referral_commission',
      },
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
 * ADMIN/BACKEND USE ONLY - Called when withdrawal is submitted
 * SECURITY: Requires admin privileges or service role
 */
export async function createWithdrawalInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.createWithdrawal({
      userId,
      amount,
      referenceId,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_create_withdrawal',
      },
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
 * ADMIN/BACKEND USE ONLY - Called when admin approves/rejects withdrawal
 * SECURITY: Requires admin privileges or service role
 */
export async function changeWithdrawalStatusInLedger(
  userId: string,
  referenceId: string,
  oldStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
  newStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
  amount: number,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.changeWithdrawalStatus({
      userId,
      referenceId,
      oldStatus,
      newStatus,
      amount,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_change_withdrawal_status',
      },
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
 * ADMIN/BACKEND USE ONLY - Called when order is placed from store
 * SECURITY: Requires admin privileges or service role
 */
export async function createOrderInLedger(
  userId: string,
  amount: number,
  referenceId: string,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.createOrder({
      userId,
      amount,
      referenceId,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_create_order',
      },
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
 * ADMIN/BACKEND USE ONLY - Called when order is cancelled
 * SECURITY: Requires admin privileges or service role
 */
export async function changeOrderStatusInLedger(
  userId: string,
  referenceId: string,
  oldStatus: string,
  newStatus: string,
  amount: number,
  metadata?: Record<string, any>
) {
  // SECURITY: Verify admin privileges
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const result = await ledgerService.changeOrderStatus({
      userId,
      referenceId,
      oldStatus,
      newStatus,
      amount,
      metadata: {
        ...(metadata || {}),
        _actor_id: auth.userId,
        _actor_action: 'admin_change_order_status',
      },
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

/**
 * Get user's balance (admin version)
 * ADMIN USE ONLY
 * SECURITY: Requires admin privileges
 */
export async function getUserBalanceAdmin(userId: string): Promise<{ success: true; balance: AvailableBalance } | { success: false; error: string }> {
  const auth = await verifyAdminOrServiceRole();
  if (!auth.isAdmin || !auth.userId) {
    return { 
      success: false, 
      error: 'Unauthorized: Admin privileges required for this operation' 
    };
  }

  try {
    const balance = await ledgerService.getAvailableBalance(userId);
    return { success: true, balance };
  } catch (error) {
    console.error('Failed to get user balance:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user balance' 
    };
  }
}
