import { NextRequest, NextResponse } from 'next/server';
import { addCashbackDirect } from '@/lib/ledger/cashback-service';
import { DatabaseError } from '@/lib/ledger/database';
import { verifyAdminToken } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    await verifyAdminToken();

    const body = await request.json();
    const { userId, amount, referenceId, metadata } = body;

    if (!userId || !amount || !referenceId) {
      return NextResponse.json(
        { error: 'userId, amount, and referenceId are required' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    const result = await addCashbackDirect({
      userId,
      amount: parseFloat(amount),
      referenceId,
      metadata,
      ipAddress,
      userAgent
    });

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
