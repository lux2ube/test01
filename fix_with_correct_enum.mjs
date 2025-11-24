import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
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
    v_transaction_type TEXT;
BEGIN
    -- Use CORRECT enum values that actually exist
    IF p_new_status IN ('Approved', 'completed', 'Completed') THEN
        v_transaction_type := 'withdrawal_completed';
    ELSIF p_new_status IN ('Rejected', 'cancelled', 'Cancelled') THEN
        v_transaction_type := 'withdrawal_cancelled';
    ELSE
        v_transaction_type := 'withdrawal_processing';
    END IF;

    -- Insert transaction
    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (
        p_user_id,
        v_transaction_type::transaction_type,
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

    -- Update balances
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

    -- Log event
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

console.log('🚀 Deploying CORRECT function to Supabase...\n');

// Execute via raw SQL using a direct insert hack
const { error } = await supabase.rpc('exec', { sql }).single();

if (error && error.message.includes('function "exec" does not exist')) {
  console.log('⚠️  Cannot execute via RPC. SQL to run manually:\n');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
  console.log('\n📋 Copy the SQL above and run it in Supabase SQL Editor');
} else if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ Function deployed!');
}

// Test it
console.log('\n🧪 Testing function...');
const { data: testData, error: testError } = await supabase.rpc('ledger_change_withdrawal_status', {
  p_user_id: '00000000-0000-0000-0000-000000000000',
  p_reference_id: '00000000-0000-0000-0000-000000000000',
  p_old_status: 'processing',
  p_new_status: 'completed',
  p_amount: 1,
  p_metadata: {},
  p_actor_id: null,
  p_actor_action: 'test'
});

if (testError) {
  console.log('Test result:', testError.message);
} else {
  console.log('✅ Function works!', testData);
}
