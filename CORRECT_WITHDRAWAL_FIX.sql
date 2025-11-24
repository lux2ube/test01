-- ============================================================================
-- CORRECT WITHDRAWAL FIX - Uses actual enum values from your Supabase
-- ============================================================================
-- Your database has: withdrawal_processing, withdrawal_cancelled, withdrawal_completed
-- NOT just "withdrawal"
-- ============================================================================

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
    v_transaction_type TEXT;
BEGIN
    -- Use CORRECT enum values that actually exist in your database
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
$$;

-- ============================================================================
-- DONE! This uses withdrawal_completed/withdrawal_cancelled/withdrawal_processing
-- ============================================================================
