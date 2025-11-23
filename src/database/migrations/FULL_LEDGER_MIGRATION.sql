-- ============================================================================
-- COMPLETE LEDGER SYSTEM MIGRATION
-- ============================================================================
-- This file contains all ledger migrations (001-010) in one consolidated file.
-- Run this entire file in your Supabase SQL Editor to set up the complete
-- financial-grade ledger system.
--
-- IMPORTANT: Make sure you have SUPABASE_SERVICE_ROLE_KEY set in your env vars
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Create Accounts Table
-- ============================================================================
-- User balance totals (running sums)
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id),
    total_earned NUMERIC NOT NULL DEFAULT 0.00 CHECK (total_earned >= 0),
    total_withdrawn NUMERIC NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    total_pending_withdrawals NUMERIC NOT NULL DEFAULT 0.00 CHECK (total_pending_withdrawals >= 0),
    total_orders NUMERIC NOT NULL DEFAULT 0.00 CHECK (total_orders >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);

COMMENT ON TABLE public.accounts IS 'User balance totals - running sums maintained by stored procedures';
COMMENT ON COLUMN public.accounts.total_earned IS 'Total cashback + referral commissions earned';
COMMENT ON COLUMN public.accounts.total_withdrawn IS 'Total successfully withdrawn (Approved only)';
COMMENT ON COLUMN public.accounts.total_pending_withdrawals IS 'Total in Processing/Pending state';
COMMENT ON COLUMN public.accounts.total_orders IS 'Total spent on store orders';


-- ============================================================================
-- MIGRATION 002: Create Account Auto-Creation Trigger
-- ============================================================================
-- Auto-create account when user signs up
CREATE OR REPLACE FUNCTION public.create_account_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.accounts (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_account_for_new_user ON public.users;
CREATE TRIGGER trigger_create_account_for_new_user
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_account_for_new_user();


-- ============================================================================
-- MIGRATION 003: Add RLS Policies for Accounts
-- ============================================================================
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;
CREATE POLICY "Users can view their own account"
    ON public.accounts
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all accounts" ON public.accounts;
CREATE POLICY "Service role can manage all accounts"
    ON public.accounts
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- MIGRATION 004: Create Transactions Table
-- ============================================================================
-- Transaction type enum
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

-- Unified ledger (single source of truth)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id),
    type transaction_type NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount <> 0),
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON public.transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
    ON public.transactions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all transactions" ON public.transactions;
CREATE POLICY "Service role can manage all transactions"
    ON public.transactions
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- MIGRATION 005: Create Immutable Events Table
-- ============================================================================
-- Permanent audit trail (cannot be modified)
CREATE TABLE IF NOT EXISTS public.immutable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.transactions(id),
    event_type VARCHAR NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_immutable_events_transaction_id ON public.immutable_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_immutable_events_created_at ON public.immutable_events(created_at DESC);

-- Prevent updates and deletes
CREATE OR REPLACE FUNCTION public.prevent_immutable_events_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Immutable events cannot be modified or deleted';
END;
$$;

DROP TRIGGER IF EXISTS trigger_prevent_update_immutable_events ON public.immutable_events;
CREATE TRIGGER trigger_prevent_update_immutable_events
    BEFORE UPDATE ON public.immutable_events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_immutable_events_modification();

DROP TRIGGER IF EXISTS trigger_prevent_delete_immutable_events ON public.immutable_events;
CREATE TRIGGER trigger_prevent_delete_immutable_events
    BEFORE DELETE ON public.immutable_events
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_immutable_events_modification();

ALTER TABLE public.immutable_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert events" ON public.immutable_events;
CREATE POLICY "Service role can insert events"
    ON public.immutable_events
    FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view events for their transactions" ON public.immutable_events;
CREATE POLICY "Users can view events for their transactions"
    ON public.immutable_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id AND t.user_id = auth.uid()
        )
    );


-- ============================================================================
-- MIGRATION 006: Create Audit Logs Table
-- ============================================================================
-- Admin action tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action VARCHAR NOT NULL,
    resource_type VARCHAR,
    resource_id UUID,
    before JSONB,
    after JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.audit_logs;
CREATE POLICY "Service role can manage audit logs"
    ON public.audit_logs
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- MIGRATION 007: Create Core Stored Procedures
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


-- ============================================================================
-- MIGRATION 008: Additional Ledger Procedures
-- ============================================================================

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


-- Procedure 6: Change Withdrawal Status
CREATE OR REPLACE FUNCTION public.ledger_change_withdrawal_status(
    p_user_id UUID,
    p_withdrawal_id UUID,
    p_old_status VARCHAR,
    p_new_status VARCHAR,
    p_amount NUMERIC,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
        RETURN QUERY SELECT FALSE, 'Invalid status transition'::TEXT;
        RETURN;
    END IF;

    INSERT INTO public.immutable_events (event_type, event_data)
    VALUES ('withdrawal_status_changed', jsonb_build_object(
        'user_id', p_user_id,
        'withdrawal_id', p_withdrawal_id,
        'old_status', p_old_status,
        'new_status', p_new_status,
        'amount', p_amount,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_change_withdrawal_status TO service_role;


-- Procedure 7: Create Order
CREATE OR REPLACE FUNCTION public.ledger_create_order(
    p_user_id UUID,
    p_amount NUMERIC,
    p_order_id UUID,
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
    VALUES (p_user_id, 'order', -p_amount, p_order_id, p_metadata)
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_orders = total_orders + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'order_created', jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'order_id', p_order_id,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_create_order TO service_role;


-- Procedure 8: Change Order Status
CREATE OR REPLACE FUNCTION public.ledger_change_order_status(
    p_user_id UUID,
    p_order_id UUID,
    p_old_status VARCHAR,
    p_new_status VARCHAR,
    p_amount NUMERIC,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_old_status = 'Pending' AND p_new_status = 'Rejected' THEN
        UPDATE public.accounts
        SET total_orders = total_orders - p_amount,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    INSERT INTO public.immutable_events (event_type, event_data)
    VALUES ('order_status_changed', jsonb_build_object(
        'user_id', p_user_id,
        'order_id', p_order_id,
        'old_status', p_old_status,
        'new_status', p_new_status,
        'amount', p_amount,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_change_order_status TO service_role;


-- ============================================================================
-- MIGRATION 009: Atomic Order Placement
-- ============================================================================

-- Procedure 9: Place Order (Atomic)
CREATE OR REPLACE FUNCTION public.ledger_place_order(
    p_user_id UUID,
    p_product_id UUID,
    p_product_name TEXT,
    p_product_image TEXT,
    p_product_price NUMERIC,
    p_user_name TEXT,
    p_user_email TEXT,
    p_delivery_phone TEXT,
    p_actor_id UUID DEFAULT NULL,
    p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, order_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
    v_transaction_id UUID;
    v_available_balance NUMERIC;
    v_current_stock INTEGER;
BEGIN
    IF p_product_price <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid product price';
        RETURN;
    END IF;

    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_current_stock IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Product not found';
        RETURN;
    END IF;

    IF v_current_stock <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Product is out of stock';
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

    IF v_available_balance < p_product_price THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient balance';
        RETURN;
    END IF;

    UPDATE public.products
    SET stock = stock - 1
    WHERE id = p_product_id;

    INSERT INTO public.orders (
        user_id,
        product_id,
        product_name,
        product_image,
        product_price,
        quantity,
        total_price,
        status,
        user_name,
        user_email,
        delivery_phone_number,
        referral_commission_awarded
    ) VALUES (
        p_user_id,
        p_product_id,
        p_product_name,
        p_product_image,
        p_product_price,
        1,
        p_product_price,
        'Pending',
        p_user_name,
        p_user_email,
        p_delivery_phone,
        FALSE
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order', -p_product_price, v_order_id, jsonb_build_object(
        'product_id', p_product_id,
        'product_name', p_product_name,
        'order_status', 'Pending'
    ))
    RETURNING id INTO v_transaction_id;

    UPDATE public.accounts
    SET total_orders = total_orders + p_product_price,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'order_placed', jsonb_build_object(
        'user_id', p_user_id,
        'order_id', v_order_id,
        'product_id', p_product_id,
        'amount', p_product_price,
        'actor_id', p_actor_id,
        'actor_action', p_actor_action,
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_order_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_place_order TO service_role;


-- ============================================================================
-- MIGRATION 010: Update Orders Table
-- ============================================================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS product_image TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS delivery_phone_number TEXT,
ADD COLUMN IF NOT EXISTS referral_commission_awarded BOOLEAN DEFAULT FALSE;

UPDATE public.orders SET quantity = 1 WHERE quantity IS NULL;
ALTER TABLE public.orders ALTER COLUMN quantity SET DEFAULT 1;

UPDATE public.orders 
SET total_price = product_price 
WHERE quantity = 1 AND total_price != product_price;

COMMENT ON COLUMN public.orders.product_image IS 'Product image URL for order display';
COMMENT ON COLUMN public.orders.user_name IS 'User name at time of order';
COMMENT ON COLUMN public.orders.user_email IS 'User email at time of order';
COMMENT ON COLUMN public.orders.delivery_phone_number IS 'Delivery contact number';
COMMENT ON COLUMN public.orders.referral_commission_awarded IS 'Whether referral commission was awarded for this order';


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- You have successfully set up the complete ledger system!
-- 
-- Next steps:
-- 1. Verify migrations: Run the verification queries in MIGRATION_GUIDE.md
-- 2. Test the system: Try adding cashback, creating orders, etc.
-- 3. Monitor audit logs: Check immutable_events and audit_logs tables
-- ============================================================================
