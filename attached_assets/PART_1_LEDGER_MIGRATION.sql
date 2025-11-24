-- ============================================================================
-- LEDGER MIGRATION - PART 1 of 2
-- ============================================================================
-- This creates the ENUM type and first 5 stored procedures
-- Run this file FIRST, then run PART_2
-- ============================================================================

-- ============================================================================
-- STEP 1: Create transaction_type ENUM (if not exists)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'cashback',
        'referral_commission',
        'referral_reversal',
        'withdrawal',
        'order'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ============================================================================
-- STEP 2: Core Stored Procedures (Part 1)
-- ============================================================================

-- Procedure 1: Add Cashback
CREATE OR REPLACE FUNCTION public.ledger_add_cashback(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id UUID,
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
    v_account_exists BOOLEAN;
BEGIN
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive';
        RETURN;
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE user_id = p_user_id) INTO v_account_exists;
    IF NOT v_account_exists THEN
        INSERT INTO public.accounts (user_id) VALUES (p_user_id);
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'cashback', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'cashback_added', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'reference_id', p_reference_id,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_add_cashback TO service_role;


-- Procedure 2: Add Referral Commission
CREATE OR REPLACE FUNCTION public.ledger_add_referral(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id UUID,
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
    v_account_exists BOOLEAN;
BEGIN
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive';
        RETURN;
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.accounts WHERE user_id = p_user_id) INTO v_account_exists;
    IF NOT v_account_exists THEN
        INSERT INTO public.accounts (user_id) VALUES (p_user_id);
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral_commission', p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_earned = total_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'referral_added', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'reference_id', p_reference_id,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_add_referral TO service_role;


-- Procedure 3: Reverse Referral Commission
CREATE OR REPLACE FUNCTION public.ledger_reverse_referral(
    p_user_id UUID,
    p_amount NUMERIC,
    p_reference_id UUID,
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
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive';
        RETURN;
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral_reversal', -p_amount, p_reference_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_earned = total_earned - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'referral_reversed', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'reference_id', p_reference_id,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_reverse_referral TO service_role;


-- Procedure 4: Get Available Balance
CREATE OR REPLACE FUNCTION public.ledger_get_available_balance(p_user_id UUID)
RETURNS TABLE(
    available_balance NUMERIC,
    total_earned NUMERIC,
    total_withdrawn NUMERIC,
    total_pending_withdrawals NUMERIC,
    total_orders NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders AS available_balance,
        a.total_earned,
        a.total_withdrawn,
        a.total_pending_withdrawals,
        a.total_orders
    FROM public.accounts a
    WHERE a.user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_get_available_balance TO authenticated, service_role;


-- Procedure 5: Create Withdrawal
CREATE OR REPLACE FUNCTION public.ledger_create_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_withdrawal_id UUID,
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
    VALUES (p_user_id, 'withdrawal', -p_amount, p_withdrawal_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_pending_withdrawals = total_pending_withdrawals + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'withdrawal_created', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'withdrawal_id', p_withdrawal_id,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_create_withdrawal TO service_role;


-- ============================================================================
-- PART 1 COMPLETE
-- ============================================================================
-- ✅ Created 5 procedures:
--    1. ledger_add_cashback
--    2. ledger_add_referral
--    3. ledger_reverse_referral
--    4. ledger_get_available_balance
--    5. ledger_create_withdrawal
--
-- 🔜 Next: Run PART_2_LEDGER_MIGRATION.sql
-- ============================================================================
