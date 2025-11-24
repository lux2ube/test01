import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SQL = `
DROP FUNCTION IF EXISTS public.ledger_change_withdrawal_status(UUID, UUID, VARCHAR, VARCHAR, NUMERIC, JSONB, UUID, VARCHAR);

CREATE OR REPLACE FUNCTION public.ledger_change_withdrawal_status(
    p_user_id UUID,
    p_reference_id UUID,
    p_old_status VARCHAR,
    p_new_status VARCHAR,
    p_amount NUMERIC,
    p_metadata JSONB DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (
        p_user_id,
        'withdrawal'::transaction_type,
        0,
        p_reference_id,
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'old_status', p_old_status,
            'new_status', p_new_status,
            'actor_id', p_actor_id,
            'actor_action', p_actor_action
        )
    )
    RETURNING id INTO v_transaction_id;

    IF (p_old_status IN ('Processing', 'processing')) AND (p_new_status IN ('Approved', 'completed', 'Completed')) THEN
        UPDATE public.accounts
        SET total_pending_withdrawals = GREATEST(0, total_pending_withdrawals - p_amount),
            total_withdrawn = total_withdrawn + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
    ELSIF (p_old_status IN ('Processing', 'processing')) AND (p_new_status IN ('Rejected', 'cancelled', 'Cancelled')) THEN
        UPDATE public.accounts
        SET total_pending_withdrawals = GREATEST(0, total_pending_withdrawals - p_amount),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid status transition'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'withdrawal_status_changed', jsonb_build_object(
        'user_id', p_user_id,
        'withdrawal_id', p_reference_id,
        'old_status', p_old_status,
        'new_status', p_new_status,
        'amount', p_amount,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$function$;
`;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Test current function
    const { error: testError } = await supabase.rpc('ledger_change_withdrawal_status', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_reference_id: '00000000-0000-0000-0000-000000000000',
      p_old_status: 'processing',
      p_new_status: 'completed',
      p_amount: 1,
      p_metadata: {},
      p_actor_id: null,
      p_actor_action: 'test'
    });

    if (testError && testError.message.includes('column "type" is of type transaction_type but expression is of type text')) {
      return NextResponse.json({
        status: 'BROKEN',
        error: 'Function exists but is broken with enum type error',
        message: 'You MUST run RUN_THIS_IN_SUPABASE.sql in Supabase SQL Editor to fix this',
        sql: SQL,
        instructions: [
          '1. Open file: RUN_THIS_IN_SUPABASE.sql',
          '2. Copy ALL content (Ctrl+A, Ctrl+C)',
          '3. Go to Supabase Dashboard → SQL Editor',
          '4. Paste and click RUN',
          '5. Refresh this page - it should say WORKING'
        ]
      }, { status: 500 });
    }

    if (testError && !testError.message.includes('Account not found')) {
      return NextResponse.json({
        status: 'ERROR',
        error: testError.message,
        sql: SQL
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'WORKING',
      message: '✅ Function is installed correctly! Withdrawal approval/rejection works.',
      testError: testError?.message || null
    });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'ERROR',
      error: error.message,
      sql: SQL
    }, { status: 500 });
  }
}
