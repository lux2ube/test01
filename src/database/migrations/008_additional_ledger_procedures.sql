-- Migration: Additional ledger procedures
-- Description: Reverse referral commission and change order status
-- Created: 2025-11-23

-- ==================================================
-- STORED PROCEDURE: Reverse Referral Commission (ACID-safe)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_reverse_referral(
    p_user_id UUID,
    p_amount NUMERIC(12, 2),
    p_reference_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    transaction_id UUID,
    event_id UUID,
    audit_id UUID,
    new_total_earned NUMERIC(12, 2)
) AS $$
DECLARE
    v_transaction_id UUID;
    v_event_id UUID;
    v_audit_id UUID;
    v_account_before JSONB;
    v_new_total_earned NUMERIC(12, 2);
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT to_jsonb(a) INTO v_account_before
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    -- Check if user has enough earned balance
    IF (v_account_before->>'total_earned')::NUMERIC < p_amount THEN
        RAISE EXCEPTION 'Insufficient earned balance to reverse. Available: %, Reversal: %',
            (v_account_before->>'total_earned')::NUMERIC, p_amount;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral_reversed', -p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'REFERRAL_COMMISSION_REVERSED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'metadata', p_metadata
        )
    )
    RETURNING id INTO v_event_id;

    UPDATE accounts
    SET total_earned = GREATEST(0, total_earned - p_amount)
    WHERE user_id = p_user_id
    RETURNING total_earned INTO v_new_total_earned;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'REFERRAL_COMMISSION_REVERSED',
        'referral_commissions',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id),
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT v_transaction_id, v_event_id, v_audit_id, v_new_total_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STORED PROCEDURE: Change Order Status (ACID-safe)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_change_order_status(
    p_user_id UUID,
    p_reference_id UUID,
    p_old_status TEXT,
    p_new_status TEXT,
    p_amount NUMERIC(12, 2),
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
    transaction_id UUID,
    event_id UUID,
    audit_id UUID
) AS $$
DECLARE
    v_transaction_id UUID;
    v_event_id UUID;
    v_audit_id UUID;
    v_account_before JSONB;
    v_transaction_type transaction_type;
BEGIN
    IF p_old_status = p_new_status THEN
        RAISE EXCEPTION 'Old and new status cannot be the same';
    END IF;

    SELECT to_jsonb(a) INTO v_account_before
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    -- Determine transaction type
    v_transaction_type := CASE
        WHEN p_new_status = 'cancelled' THEN 'order_cancelled'::transaction_type
        ELSE 'order_created'::transaction_type
    END;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (
        p_user_id,
        v_transaction_type,
        0,
        p_reference_id,
        jsonb_build_object('old_status', p_old_status, 'new_status', p_new_status) || p_metadata
    )
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'ORDER_STATUS_CHANGED',
        jsonb_build_object(
            'user_id', p_user_id,
            'reference_id', p_reference_id,
            'old_status', p_old_status,
            'new_status', p_new_status,
            'amount', p_amount
        )
    )
    RETURNING id INTO v_event_id;

    -- Update account based on status change
    -- If order is cancelled, decrease total_orders (return funds to available balance)
    IF p_new_status = 'cancelled' AND p_old_status != 'cancelled' THEN
        UPDATE accounts
        SET total_orders = GREATEST(0, total_orders - p_amount)
        WHERE user_id = p_user_id;
    END IF;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'ORDER_STATUS_CHANGED',
        'orders',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id),
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT v_transaction_id, v_event_id, v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STORED PROCEDURE: Get Available Balance (View Function)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_get_available_balance(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    total_earned NUMERIC(12, 2),
    total_withdrawn NUMERIC(12, 2),
    total_pending_withdrawals NUMERIC(12, 2),
    total_orders NUMERIC(12, 2),
    available_balance NUMERIC(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.user_id,
        a.total_earned,
        a.total_withdrawn,
        a.total_pending_withdrawals,
        a.total_orders,
        (a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders) AS available_balance
    FROM accounts a
    WHERE a.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- GRANT EXECUTE PERMISSIONS
-- ==================================================
GRANT EXECUTE ON FUNCTION ledger_reverse_referral TO service_role;
GRANT EXECUTE ON FUNCTION ledger_change_order_status TO service_role;
GRANT EXECUTE ON FUNCTION ledger_get_available_balance TO service_role;
GRANT EXECUTE ON FUNCTION ledger_get_available_balance TO authenticated; -- Users can view their own balance

COMMENT ON FUNCTION ledger_reverse_referral IS 'Reverses a referral commission, decreasing total_earned';
COMMENT ON FUNCTION ledger_change_order_status IS 'Changes order status and updates total_orders accordingly';
COMMENT ON FUNCTION ledger_get_available_balance IS 'Calculates and returns available balance for a user';
