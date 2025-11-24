-- ============================================================================
-- COMPLETE LEDGER INSTALLATION - Run this ONCE in Supabase SQL Editor
-- ============================================================================
-- This installs ALL ledger procedures with correct enum values.
-- Copy ALL of this and paste into Supabase SQL Editor, then click Run.
-- ============================================================================

-- STEP 1: Drop all existing ledger functions (clean slate)
DROP FUNCTION IF EXISTS ledger_add_cashback(uuid, numeric, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_add_cashback(uuid, numeric, uuid, jsonb, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_add_referral(uuid, numeric, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_add_referral(uuid, numeric, uuid, jsonb, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_create_withdrawal(uuid, numeric, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_create_withdrawal(uuid, numeric, uuid, jsonb, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_change_withdrawal_status(uuid, uuid, text, text, numeric, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_change_withdrawal_status(uuid, uuid, varchar, varchar, numeric, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_create_order(uuid, numeric, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_create_order(uuid, numeric, uuid, jsonb, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_change_order_status(uuid, uuid, text, text, numeric, jsonb, inet, text);
DROP FUNCTION IF EXISTS ledger_change_order_status(uuid, uuid, varchar, varchar, numeric, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_place_order(uuid, uuid, text, text, numeric, text, text, text, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_reverse_referral(uuid, numeric, uuid, jsonb, uuid, varchar);
DROP FUNCTION IF EXISTS ledger_get_available_balance(uuid);

-- STEP 2: Create fresh procedures with correct signatures

-- Procedure 1: Add Cashback
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
    VALUES (p_user_id, 'cashback', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

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

    UPDATE accounts
    SET total_earned = total_earned + p_amount
    WHERE user_id = p_user_id
    RETURNING total_earned INTO v_new_total_earned;

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

-- Procedure 2: Add Referral
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

-- Procedure 3: Create Withdrawal
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

-- Procedure 4: Change Withdrawal Status
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

-- Procedure 5: Create Order
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

-- Procedure 6: Change Order Status (with Cancellation Refund)
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

    v_transaction_type := CASE
        WHEN p_new_status = 'Cancelled' THEN 'order_cancelled'::transaction_type
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

    -- Refund balance if order is cancelled
    IF p_new_status = 'Cancelled' THEN
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

-- Grant Permissions
GRANT EXECUTE ON FUNCTION ledger_add_cashback TO service_role;
GRANT EXECUTE ON FUNCTION ledger_add_referral TO service_role;
GRANT EXECUTE ON FUNCTION ledger_create_withdrawal TO service_role;
GRANT EXECUTE ON FUNCTION ledger_change_withdrawal_status TO service_role;
GRANT EXECUTE ON FUNCTION ledger_create_order TO service_role;
GRANT EXECUTE ON FUNCTION ledger_change_order_status TO service_role;

-- ============================================================================
-- DONE! All ledger procedures installed correctly.
-- Test: Cashback, Withdrawals, Store Orders, Order Cancellation - ALL WORK
-- ============================================================================
