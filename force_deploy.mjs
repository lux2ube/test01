import pg from 'pg';
const { Client } = pg;

// Extract Supabase connection details from URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL');
  process.exit(1);
}

// Parse Supabase URL to get database connection details
// Format: https://xxxxx.supabase.co
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const host = `db.${projectRef}.supabase.co`;
const port = 5432;
const database = 'postgres';
const user = 'postgres';

console.log(`🔌 Connecting to Supabase PostgreSQL...`);
console.log(`   Host: ${host}`);

// You need the database password - it's different from service role key
console.log('\n⚠️  I need your Supabase DATABASE PASSWORD (not the service role key)');
console.log('   Find it in: Supabase Dashboard → Project Settings → Database → Password');
console.log('\n   For now, I\'ll show you the SQL to run manually...\n');

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
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.ledger_change_withdrawal_status TO service_role;
`;

console.log('='.repeat(80));
console.log(sql);
console.log('='.repeat(80));
console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor\n');

