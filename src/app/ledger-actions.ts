'use server';

import { getAvailableBalance } from '@/lib/ledger/balance-service';
import { addCashbackDirect } from '@/lib/ledger/cashback-service';
import { addReferralCommission, reverseReferralCommission } from '@/lib/ledger/referral-service';
import { createWithdrawal, changeWithdrawalStatus } from '@/lib/ledger/withdrawal-service';
import { createOrder, changeOrderStatus } from '@/lib/ledger/order-service';
import { DatabaseError, InsufficientBalanceError } from '@/lib/ledger/database';
import { verifyAuthToken, verifyAdminToken } from '@/lib/auth-helpers';
import { AvailableBalance } from '@/types/ledger';
import { headers } from 'next/headers';

type LedgerResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
};

async function getClientInfo() {
  const headersList = await headers();
  return {
    ipAddress: headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined,
    userAgent: headersList.get('user-agent') || undefined
  };
}

export async function getUserBalance(): Promise<LedgerResult<AvailableBalance>> {
  try {
    const user = await verifyAuthToken();
    const balance = await getAvailableBalance(user.id);

    return {
      success: true,
      data: balance
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch balance'
    };
  }
}

export async function addCashback(params: {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    await verifyAdminToken();

    const { ipAddress, userAgent } = await getClientInfo();

    const result = await addCashbackDirect({
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add cashback'
    };
  }
}

export async function addReferralCommissionAction(params: {
  userId: string;
  amount: number;
  referenceId: string;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    await verifyAdminToken();

    const { ipAddress, userAgent } = await getClientInfo();

    const result = await addReferralCommission({
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add referral commission'
    };
  }
}

export async function reverseReferralCommissionAction(params: {
  userId: string;
  amount: number;
  referenceId: string;
  reason: string;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    await verifyAdminToken();

    const { ipAddress, userAgent } = await getClientInfo();

    const result = await reverseReferralCommission({
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reverse referral commission'
    };
  }
}

export async function createWithdrawalAction(params: {
  amount: number;
  referenceId: string;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    const user = await verifyAuthToken();
    const { ipAddress, userAgent } = await getClientInfo();

    const result = await createWithdrawal({
      userId: user.id,
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return {
        success: false,
        error: error.message
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create withdrawal'
    };
  }
}

export async function changeWithdrawalStatusAction(params: {
  userId: string;
  referenceId: string;
  oldStatus: 'processing' | 'completed' | 'cancelled';
  newStatus: 'processing' | 'completed' | 'cancelled';
  amount: number;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    await verifyAdminToken();

    const { ipAddress, userAgent } = await getClientInfo();

    const result = await changeWithdrawalStatus({
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change withdrawal status'
    };
  }
}

export async function createOrderAction(params: {
  amount: number;
  referenceId: string;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    const user = await verifyAuthToken();
    const { ipAddress, userAgent } = await getClientInfo();

    const result = await createOrder({
      userId: user.id,
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof InsufficientBalanceError) {
      return {
        success: false,
        error: error.message
      };
    }

    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order'
    };
  }
}

export async function changeOrderStatusAction(params: {
  userId: string;
  referenceId: string;
  oldStatus: string;
  newStatus: string;
  amount: number;
  metadata?: any;
}): Promise<LedgerResult> {
  try {
    await verifyAdminToken();

    const { ipAddress, userAgent } = await getClientInfo();

    const result = await changeOrderStatus({
      ...params,
      ipAddress,
      userAgent
    });

    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change order status'
    };
  }
}
