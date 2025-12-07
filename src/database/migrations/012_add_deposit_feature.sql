-- Migration: Add Deposit Feature
-- Description: Adds total_deposit column and ledger_add_deposit stored procedure
-- IMPORTANT: Deposits are SEPARATE from total_earned (cashback/referrals)
-- New balance formula: total_earned + total_deposit - total_withdrawn - total_pending_withdrawals - total_orders
-- Created: 2025-12-07

-- ==================================================
-- STEP 1: Add total_deposit column to accounts table
-- ==================================================
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS total_deposit NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

-- Add constraint for positive values
ALTER TABLE accounts
ADD CONSTRAINT IF NOT EXISTS positive_total_deposit CHECK (total_deposit >= 0);

-- Add comment for documentation
COMMENT ON COLUMN accounts.total_deposit IS 'Sum of all admin deposits. Separate from total_earned which tracks cashback/referrals only.';

-- ==================================================
-- STEP 2: Create ledger_add_deposit stored procedure
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_add_deposit(
    p_user_id UUID,
    p_amount NUMERIC(12, 2),
    p_reference_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    transaction_id UUID,
    error_message TEXT,
    new_total_deposit NUMERIC(12, 2)
) AS $$
DECLARE
    v_transaction_id UUID;
    v_event_id UUID;
    v_audit_id UUID;
    v_account_before JSONB;
    v_new_total_deposit NUMERIC(12, 2);
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Lock account row and get state before
    SELECT to_jsonb(a) INTO v_account_before
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, format('Account not found for user %s', p_user_id)::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Insert transaction record
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'deposit', p_amount, p_reference_id, 
            jsonb_build_object(
                'actor_id', p_actor_id,
                'actor_action', p_actor_action
            ) || COALESCE(p_metadata, '{}'::jsonb))
    RETURNING id INTO v_transaction_id;

    -- Insert immutable event for audit trail
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'DEPOSIT_ADDED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'actor_id', p_actor_id,
            'actor_action', p_actor_action,
            'metadata', p_metadata
        )
    )
    RETURNING id INTO v_event_id;

    -- Update account totals - increases total_deposit (NOT total_earned)
    UPDATE accounts
    SET total_deposit = total_deposit + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_deposit INTO v_new_total_deposit;

    -- Insert audit log
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after)
    VALUES (
        p_user_id,
        'DEPOSIT_ADDED',
        'deposits',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id)
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT, v_new_total_deposit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION ledger_add_deposit TO service_role;

-- ==================================================
-- STEP 3: Update ledger_create_withdrawal to include total_deposit in balance check
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_create_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC(12, 2),
    p_reference_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    transaction_id UUID,
    error_message TEXT,
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
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Lock account row for update - NEW FORMULA includes total_deposit
    SELECT 
        to_jsonb(a),
        (a.total_earned + COALESCE(a.total_deposit, 0) - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders)
    INTO v_account_before, v_available_balance
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, format('Account not found for user %s', p_user_id)::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Check sufficient balance
    IF v_available_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, format('Insufficient balance. Available: %s, Requested: %s', v_available_balance, p_amount)::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal_processing', -p_amount, p_reference_id, 
            jsonb_build_object(
                'actor_id', p_actor_id,
                'actor_action', p_actor_action
            ) || COALESCE(p_metadata, '{}'::jsonb))
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
    SET total_pending_withdrawals = total_pending_withdrawals + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_pending_withdrawals INTO v_new_total_pending;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after)
    VALUES (
        p_user_id,
        'WITHDRAWAL_CREATED',
        'withdrawals',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id)
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT, v_new_total_pending;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ledger_create_withdrawal TO service_role;

-- ==================================================
-- STEP 4: Update ledger_create_order to include total_deposit in balance check
-- ==================================================
CREATE OR REPLACE FUNCTION ledger_create_order(
    p_user_id UUID,
    p_amount NUMERIC(12, 2),
    p_reference_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    transaction_id UUID,
    error_message TEXT,
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
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Lock account row for update - NEW FORMULA includes total_deposit
    SELECT 
        to_jsonb(a),
        (a.total_earned + COALESCE(a.total_deposit, 0) - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders)
    INTO v_account_before, v_available_balance
    FROM accounts a
    WHERE a.user_id = p_user_id
    FOR UPDATE;

    IF v_account_before IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, format('Account not found for user %s', p_user_id)::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    -- Check sufficient balance
    IF v_available_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, format('Insufficient balance. Available: %s, Requested: %s', v_available_balance, p_amount)::TEXT, NULL::NUMERIC(12,2);
        RETURN;
    END IF;

    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order_created', -p_amount, p_reference_id, 
            jsonb_build_object(
                'actor_id', p_actor_id,
                'actor_action', p_actor_action
            ) || COALESCE(p_metadata, '{}'::jsonb))
    RETURNING id INTO v_transaction_id;

    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (
        v_transaction_id,
        'ORDER_CREATED',
        jsonb_build_object(
            'user_id', p_user_id,
            'amount', p_amount,
            'reference_id', p_reference_id,
            'status', 'processing'
        )
    )
    RETURNING id INTO v_event_id;

    UPDATE accounts
    SET total_orders = total_orders + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_orders INTO v_new_total_orders;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, before, after)
    VALUES (
        p_user_id,
        'ORDER_CREATED',
        'orders',
        p_reference_id,
        v_account_before,
        (SELECT to_jsonb(a) FROM accounts a WHERE a.user_id = p_user_id)
    )
    RETURNING id INTO v_audit_id;

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT, v_new_total_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION ledger_create_order TO service_role;

-- ==================================================
-- STEP 5: Update auto-account trigger to include total_deposit
-- ==================================================
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO accounts (user_id, total_earned, total_withdrawn, total_pending_withdrawals, total_orders, total_deposit)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================
-- Update table comment to reflect new formula
-- ==================================================
COMMENT ON TABLE accounts IS 'Stores running totals for user balances. Available balance is calculated as: total_earned + total_deposit - total_withdrawn - total_pending_withdrawals - total_orders';
