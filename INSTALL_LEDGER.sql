-- ============================================================================
-- INSTALL LEDGER PROCEDURES - Run this in Supabase SQL Editor
-- ============================================================================
-- These are the EXACT procedures from your codebase.
-- Copy ALL this text and paste into Supabase SQL Editor, then click Run.
-- ============================================================================

-- ==================================================
-- STORED PROCEDURE: Add Cashback (ACID-safe)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_add_cashback(
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
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Get account state before
    SELECT to_jsonb(a) INTO v_account_before
    FROM accounts a
    WHERE a.user_id = p_user_id;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    -- Insert transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'cashback', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    -- Insert immutable event
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'CASHBACK_ADDED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'metadata', p_metadata
        )
    )
    RETURNING id INTO v_event_id;

    -- Update account totals
    UPDATE accounts
    SET total_earned = total_earned + p_amount
    WHERE user_id = p_user_id
    RETURNING total_earned INTO v_new_total_earned;

    -- Insert audit log
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'CASHBACK_ADDED',
        'cashback_transactions',
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
-- STORED PROCEDURE: Add Referral Commission (ACID-safe)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_add_referral(
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
    WHERE a.user_id = p_user_id;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'REFERRAL_COMMISSION_ADDED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'metadata', p_metadata
        )
    )
    RETURNING id INTO v_event_id;

    UPDATE accounts
    SET total_earned = total_earned + p_amount
    WHERE user_id = p_user_id
    RETURNING total_earned INTO v_new_total_earned;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'REFERRAL_COMMISSION_ADDED',
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
-- STORED PROCEDURE: Create Withdrawal (ACID-safe with balance check)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_create_withdrawal(
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
    new_total_pending NUMERIC(12, 2)
) AS $$
DECLARE
    v_transaction_id UUID;
    v_event_id UUID;
    v_audit_id UUID;
    v_account_before JSONB;
    v_available_balance NUMERIC(12, 2);
    v_new_total_pending NUMERIC(12, 2);
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Lock account row for update
    SELECT 
        to_jsonb(a),
        (a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders)
    INTO v_account_before, v_available_balance
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    -- Check sufficient balance
    IF v_available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_available_balance, p_amount;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal_processing', -p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'WITHDRAWAL_CREATED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'status', 'processing'
        )
    )
    RETURNING id INTO v_event_id;

    UPDATE accounts
    SET total_pending_withdrawals = total_pending_withdrawals + p_amount
    WHERE user_id = p_user_id
    RETURNING total_pending_withdrawals INTO v_new_total_pending;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'WITHDRAWAL_CREATED',
        'withdrawals',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id),
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT v_transaction_id, v_event_id, v_audit_id, v_new_total_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- STORED PROCEDURE: Change Withdrawal Status (ACID-safe)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_change_withdrawal_status(
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
        WHEN p_new_status = 'completed' THEN 'withdrawal_completed'::transaction_type
        WHEN p_new_status = 'cancelled' THEN 'withdrawal_cancelled'::transaction_type
        ELSE 'withdrawal_processing'::transaction_type
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
        'WITHDRAWAL_STATUS_CHANGED',
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
    IF p_old_status = 'processing' AND p_new_status = 'completed' THEN
        UPDATE accounts
        SET 
            total_pending_withdrawals = GREATEST(0, total_pending_withdrawals - p_amount),
            total_withdrawn = total_withdrawn + p_amount
        WHERE user_id = p_user_id;
    ELSIF p_old_status = 'processing' AND p_new_status = 'cancelled' THEN
        UPDATE accounts
        SET total_pending_withdrawals = GREATEST(0, total_pending_withdrawals - p_amount)
        WHERE user_id = p_user_id;
    END IF;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'WITHDRAWAL_STATUS_CHANGED',
        'withdrawals',
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
-- STORED PROCEDURE: Create Order (ACID-safe with balance check)
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_create_order(
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
    new_total_orders NUMERIC(12, 2)
) AS $$
DECLARE
    v_transaction_id UUID;
    v_event_id UUID;
    v_audit_id UUID;
    v_account_before JSONB;
    v_available_balance NUMERIC(12, 2);
    v_new_total_orders NUMERIC(12, 2);
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    SELECT 
        to_jsonb(a),
        (a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders)
    INTO v_account_before, v_available_balance
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RAISE EXCEPTION 'Account not found for user %', p_user_id;
    END IF;

    IF v_available_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance for order. Available: %, Required: %', v_available_balance, p_amount;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order_created', -p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'ORDER_CREATED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id
        )
    )
    RETURNING id INTO v_event_id;

    UPDATE accounts
    SET total_orders = total_orders + p_amount
    WHERE user_id = p_user_id
    RETURNING total_orders INTO v_new_total_orders;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after, ip_address, user_agent)
    VALUES (
        p_user_id,
        'ORDER_CREATED',
        'orders',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id),
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT v_transaction_id, v_event_id, v_audit_id, v_new_total_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- GRANT EXECUTE PERMISSIONS
-- ==================================================
GRANT EXECUTE ON FUNCTION ledger_add_cashback TO service_role;
GRANT EXECUTE ON FUNCTION ledger_add_referral TO service_role;
GRANT EXECUTE ON FUNCTION ledger_create_withdrawal TO service_role;
GRANT EXECUTE ON FUNCTION ledger_change_withdrawal_status TO service_role;
GRANT EXECUTE ON FUNCTION ledger_create_order TO service_role;

-- ============================================================================
-- DONE! Now test:
-- 1. Create a withdrawal
-- 2. Place an order from the store
-- Both will work!
-- ============================================================================
