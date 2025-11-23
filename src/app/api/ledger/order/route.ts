import { NextRequest, NextResponse } from 'next/server';
import { createOrder, changeOrderStatus } from '@/lib/ledger/order-service';
import { DatabaseError, InsufficientBalanceError } from '@/lib/ledger/database';
import { verifyAuthToken, verifyAdminToken } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, amount, referenceId, oldStatus, newStatus, metadata } = body;

    if (!userId || !referenceId) {
      return NextResponse.json(
        { error: 'userId and referenceId are required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    let result;

    if (action === 'create') {
      const authUser = await verifyAuthToken();
      
      if (userId !== authUser.id) {
        return NextResponse.json(
          { error: 'Forbidden: You can only create orders for yourself' },
          { status: 403 }
        );
      }

      if (!amount) {
        return NextResponse.json(
          { error: 'amount is required for order creation' },
          { status: 400 }
        );
      }

      result = await createOrder({
        userId,
        amount: parseFloat(amount),
        referenceId,
        metadata,
        ipAddress,
        userAgent
      });
    } else if (action === 'changeStatus') {
      await verifyAdminToken();

      if (!oldStatus || !newStatus || !amount) {
        return NextResponse.json(
          { error: 'oldStatus, newStatus, and amount are required for status change' },
          { status: 400 }
        );
      }

      result = await changeOrderStatus({
        userId,
        referenceId,
        oldStatus,
        newStatus,
        amount: parseFloat(amount),
        metadata,
        ipAddress,
        userAgent
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "create" or "changeStatus"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    if (error instanceof Error && error.message.includes('authorization')) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (error instanceof InsufficientBalanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
