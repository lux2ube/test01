import { NextRequest, NextResponse } from 'next/server';
import { getAvailableBalance } from '@/lib/ledger/balance-service';
import { DatabaseError } from '@/lib/ledger/database';
import { verifyAuthToken } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyAuthToken();

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    const userId = requestedUserId || authUser.id;

    if (userId !== authUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own balance' },
        { status: 403 }
      );
    }

    const balance = await getAvailableBalance(userId);

    return NextResponse.json({
      success: true,
      data: balance
    });
  } catch (error) {
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
