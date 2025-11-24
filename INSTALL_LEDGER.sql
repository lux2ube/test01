-- Copy this entire file and paste into Supabase SQL Editor, then click Run

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    total_earned NUMERIC NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC NOT NULL DEFAULT 0.00,
    total_pending_withdrawals NUMERIC NOT NULL DEFAULT 0.00,
    total_orders NUMERIC NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    reference_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create stored procedure for adding cashback
CREATE OR REPLACE FUNCTION ledger_add_cashback(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_account_id UUID;
    v_transaction_id UUID;
BEGIN
    -- Get or create account
    INSERT INTO accounts (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT id INTO v_account_id FROM accounts WHERE user_id = p_user_id;
    
    -- Create transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'cashback', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    -- Update account totals
    UPDATE accounts
    SET total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT true, v_transaction_id, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM;
END;
$$;

-- Create stored procedure for withdrawal creation
CREATE OR REPLACE FUNCTION ledger_create_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available NUMERIC;
    v_transaction_id UUID;
BEGIN
    -- Check available balance
    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders)
    INTO v_available
    FROM accounts
    WHERE user_id = p_user_id;
    
    IF v_available < p_amount THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Insufficient balance'::TEXT;
        RETURN;
    END IF;
    
    -- Create transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal_pending', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    -- Update pending withdrawals
    UPDATE accounts
    SET total_pending_withdrawals = total_pending_withdrawals + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT true, v_transaction_id, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM;
END;
$$;

-- Create stored procedure for withdrawal status change
CREATE OR REPLACE FUNCTION ledger_change_withdrawal_status(
    p_user_id UUID,
    p_reference_id TEXT,
    p_old_status TEXT,
    p_new_status TEXT,
    p_amount NUMERIC,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- Create transaction
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal_' || p_new_status, p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    -- Update account based on status change
    IF p_new_status = 'completed' THEN
        UPDATE accounts
        SET total_pending_withdrawals = total_pending_withdrawals - p_amount,
            total_withdrawn = total_withdrawn + p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_new_status = 'cancelled' THEN
        UPDATE accounts
        SET total_pending_withdrawals = total_pending_withdrawals - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN QUERY SELECT true, v_transaction_id, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM;
END;
$$;

-- Create stored procedure for referrals
CREATE OR REPLACE FUNCTION ledger_add_referral(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    UPDATE accounts
    SET total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT true, v_transaction_id, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM;
END;
$$;

-- Create stored procedure for orders
CREATE OR REPLACE FUNCTION ledger_create_order(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_available NUMERIC;
    v_transaction_id UUID;
BEGIN
    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders)
    INTO v_available
    FROM accounts
    WHERE user_id = p_user_id;
    
    IF v_available < p_amount THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Insufficient balance'::TEXT;
        RETURN;
    END IF;
    
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;
    
    UPDATE accounts
    SET total_orders = total_orders + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT true, v_transaction_id, NULL::TEXT;
EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, NULL::UUID, SQLERRM;
END;
$$;

-- Done! Now test by creating a withdrawal
