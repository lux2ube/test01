-- ============================================================================
-- FIX WITHDRAWAL STATUS CHANGE PROCEDURE ONLY
-- ============================================================================
-- Fixes approve/reject withdrawal function to match app expectations
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.ledger_change_withdrawal_status(UUID, UUID, VARCHAR, VARCHAR, NUMERIC, UUID, VARCHAR);

-- Create corrected function
CREATE OR REPLACE FUNCTION public.ledger_change_withdrawal_status(
    p_user_id UUID,
    p_reference_id UUID,         -- ✅ Changed from p_withdrawal_id to match app
    p_old_status VARCHAR,
    p_new_status VARCHAR,
    p_amount NUMERIC,
    p_metadata JSONB DEFAULT NULL,  -- ✅ Added p_metadata parameter
    p_actor_id UUID DEFAULT NULL,
    p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)  -- ✅ Added transaction_id to return
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Create a transaction record for the status change
    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (
        p_user_id, 
        CASE 
            WHEN p_new_status = 'Approved' THEN 'withdrawal_completed'
            WHEN p_new_status = 'Rejected' THEN 'withdrawal_cancelled'
            ELSE 'withdrawal_processing'
        END,
        0,  -- Status change doesn't affect amount (already tracked in create)
        p_reference_id, 
        p_metadata
    )
    RETURNING id INTO v_transaction_id;

    -- Update account balances based on status transition
    IF p_old_status = 'Processing' AND p_new_status = 'Approved' THEN
        UPDATE public.accounts
        SET total_pending_withdrawals = total_pending_withdrawals - p_amount,
            total_withdrawn = total_withdrawn + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_old_status = 'Processing' AND p_new_status = 'Rejected' THEN
        UPDATE public.accounts
        SET total_pending_withdrawals = total_pending_withdrawals - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid status transition'::TEXT;
        RETURN;
    END IF;

    -- Log the event
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

-- ============================================================================
-- DONE! Withdrawal approve/reject will now work correctly
-- ============================================================================
