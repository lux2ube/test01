-- ============================================================================
-- FIX WITHDRAWAL PROCEDURE ONLY
-- ============================================================================
-- The app sends p_reference_id but database expects p_withdrawal_id
-- This fixes ONLY the withdrawal procedure without touching anything else
-- ============================================================================

-- Drop existing withdrawal function
DROP FUNCTION IF EXISTS public.ledger_create_withdrawal(UUID, NUMERIC, UUID, JSONB, UUID, VARCHAR);

-- Create corrected withdrawal function with p_reference_id parameter
CREATE OR REPLACE FUNCTION public.ledger_create_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id UUID,  -- ✅ Changed from p_withdrawal_id to p_reference_id
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
    v_available_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive';
        RETURN;
    END IF;

    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders)
    INTO v_available_balance
    FROM public.accounts
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_available_balance IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Account not found';
        RETURN;
    END IF;

    IF v_available_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient balance';
        RETURN;
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal_processing', -p_amount, p_reference_id, p_metadata)  -- ✅ Changed to withdrawal_processing
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_pending_withdrawals = total_pending_withdrawals + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'withdrawal_created', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'withdrawal_id', p_reference_id,  -- Using p_reference_id here
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_create_withdrawal TO service_role;

-- ============================================================================
-- DONE! Withdrawal procedure fixed to accept p_reference_id parameter
-- ============================================================================
