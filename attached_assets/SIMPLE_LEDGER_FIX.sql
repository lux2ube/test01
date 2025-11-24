-- ============================================================================
-- SIMPLE LEDGER FIX - Single file with proper Supabase settings
-- ============================================================================
-- Copy this entire file and paste into Supabase SQL Editor, then click RUN
-- ============================================================================

-- Create ENUM if needed
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('cashback', 'referral_commission', 'referral_reversal', 'withdrawal', 'order');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Add Cashback
CREATE OR REPLACE FUNCTION public.ledger_add_cashback(
    p_user_id UUID, p_amount NUMERIC, p_reference_id UUID,
    p_metadata JSONB DEFAULT NULL, p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_transaction_id UUID; v_account_exists BOOLEAN;
BEGIN
    IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'; RETURN; END IF;
    SELECT EXISTS(SELECT 1 FROM accounts WHERE user_id = p_user_id) INTO v_account_exists;
    IF NOT v_account_exists THEN INSERT INTO accounts (user_id) VALUES (p_user_id); END IF;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'cashback', p_amount, p_reference_id, p_metadata) RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_earned = total_earned + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'cashback_added', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'reference_id', p_reference_id, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_add_cashback TO service_role;

-- 2. Add Referral
CREATE OR REPLACE FUNCTION public.ledger_add_referral(
    p_user_id UUID, p_amount NUMERIC, p_reference_id UUID,
    p_metadata JSONB DEFAULT NULL, p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_transaction_id UUID; v_account_exists BOOLEAN;
BEGIN
    IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'; RETURN; END IF;
    SELECT EXISTS(SELECT 1 FROM accounts WHERE user_id = p_user_id) INTO v_account_exists;
    IF NOT v_account_exists THEN INSERT INTO accounts (user_id) VALUES (p_user_id); END IF;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral_commission', p_amount, p_reference_id, p_metadata) RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_earned = total_earned + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'referral_added', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'reference_id', p_reference_id, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_add_referral TO service_role;

-- 3. Reverse Referral
CREATE OR REPLACE FUNCTION public.ledger_reverse_referral(
    p_user_id UUID, p_amount NUMERIC, p_reference_id UUID,
    p_metadata JSONB DEFAULT NULL, p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_transaction_id UUID;
BEGIN
    IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'; RETURN; END IF;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'referral_reversal', -p_amount, p_reference_id, p_metadata) RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_earned = total_earned - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'referral_reversed', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_reverse_referral TO service_role;

-- 4. Get Balance
CREATE OR REPLACE FUNCTION public.ledger_get_available_balance(p_user_id UUID)
RETURNS TABLE(available_balance NUMERIC, total_earned NUMERIC, total_withdrawn NUMERIC, total_pending_withdrawals NUMERIC, total_orders NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY SELECT 
        a.total_earned - a.total_withdrawn - a.total_pending_withdrawals - a.total_orders,
        a.total_earned, a.total_withdrawn, a.total_pending_withdrawals, a.total_orders
    FROM accounts a WHERE a.user_id = p_user_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_get_available_balance TO authenticated, service_role;

-- 5. Create Withdrawal
CREATE OR REPLACE FUNCTION public.ledger_create_withdrawal(
    p_user_id UUID, p_amount NUMERIC, p_withdrawal_id UUID,
    p_metadata JSONB DEFAULT NULL, p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_transaction_id UUID; v_available_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'; RETURN; END IF;
    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders) INTO v_available_balance
    FROM accounts WHERE user_id = p_user_id FOR UPDATE;
    IF v_available_balance IS NULL THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Account not found'; RETURN; END IF;
    IF v_available_balance < p_amount THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient balance'; RETURN; END IF;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'withdrawal', -p_amount, p_withdrawal_id, p_metadata) RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_pending_withdrawals = total_pending_withdrawals + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'withdrawal_created', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'withdrawal_id', p_withdrawal_id, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_create_withdrawal TO service_role;

-- 6. Change Withdrawal Status
CREATE OR REPLACE FUNCTION public.ledger_change_withdrawal_status(
    p_user_id UUID, p_withdrawal_id UUID, p_old_status VARCHAR, p_new_status VARCHAR, p_amount NUMERIC,
    p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF p_old_status = 'Processing' AND p_new_status = 'Approved' THEN
        UPDATE accounts SET total_pending_withdrawals = total_pending_withdrawals - p_amount,
            total_withdrawn = total_withdrawn + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    ELSIF p_old_status = 'Processing' AND p_new_status = 'Rejected' THEN
        UPDATE accounts SET total_pending_withdrawals = total_pending_withdrawals - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    ELSE RETURN QUERY SELECT FALSE, 'Invalid status transition'::TEXT; RETURN; END IF;
    INSERT INTO immutable_events (event_type, event_data)
    VALUES ('withdrawal_status_changed', jsonb_build_object('withdrawal_id', p_withdrawal_id, 'old_status', p_old_status, 'new_status', p_new_status, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_change_withdrawal_status TO service_role;

-- 7. Create Order
CREATE OR REPLACE FUNCTION public.ledger_create_order(
    p_user_id UUID, p_amount NUMERIC, p_order_id UUID,
    p_metadata JSONB DEFAULT NULL, p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_transaction_id UUID; v_available_balance NUMERIC;
BEGIN
    IF p_amount <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Amount must be positive'; RETURN; END IF;
    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders) INTO v_available_balance
    FROM accounts WHERE user_id = p_user_id FOR UPDATE;
    IF v_available_balance IS NULL THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Account not found'; RETURN; END IF;
    IF v_available_balance < p_amount THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient balance'; RETURN; END IF;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order', -p_amount, p_order_id, p_metadata) RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_orders = total_orders + p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'order_created', jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'order_id', p_order_id, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_create_order TO service_role;

-- 8. Change Order Status
CREATE OR REPLACE FUNCTION public.ledger_change_order_status(
    p_user_id UUID, p_order_id UUID, p_old_status VARCHAR, p_new_status VARCHAR, p_amount NUMERIC,
    p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF p_old_status = 'Pending' AND p_new_status = 'Rejected' THEN
        UPDATE accounts SET total_orders = total_orders - p_amount, updated_at = NOW() WHERE user_id = p_user_id;
    END IF;
    INSERT INTO immutable_events (event_type, event_data)
    VALUES ('order_status_changed', jsonb_build_object('order_id', p_order_id, 'old_status', p_old_status, 'new_status', p_new_status, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_change_order_status TO service_role;

-- 9. Place Order
CREATE OR REPLACE FUNCTION public.ledger_place_order(
    p_user_id UUID, p_product_id UUID, p_product_name TEXT, p_product_image TEXT, p_product_price NUMERIC,
    p_user_name TEXT, p_user_email TEXT, p_delivery_phone TEXT,
    p_actor_id UUID DEFAULT NULL, p_actor_action VARCHAR DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, order_id UUID, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE v_order_id UUID; v_transaction_id UUID; v_available_balance NUMERIC; v_current_stock INTEGER;
BEGIN
    IF p_product_price <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid product price'; RETURN; END IF;
    SELECT stock INTO v_current_stock FROM products WHERE id = p_product_id FOR UPDATE;
    IF v_current_stock IS NULL THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Product not found'; RETURN; END IF;
    IF v_current_stock <= 0 THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Product is out of stock'; RETURN; END IF;
    SELECT (total_earned - total_withdrawn - total_pending_withdrawals - total_orders) INTO v_available_balance
    FROM accounts WHERE user_id = p_user_id FOR UPDATE;
    IF v_available_balance IS NULL THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Account not found'; RETURN; END IF;
    IF v_available_balance < p_product_price THEN RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient balance'; RETURN; END IF;
    UPDATE products SET stock = stock - 1 WHERE id = p_product_id;
    INSERT INTO orders (user_id, product_id, product_name, product_image, product_price, quantity, total_price, status, user_name, user_email, delivery_phone_number, referral_commission_awarded)
    VALUES (p_user_id, p_product_id, p_product_name, p_product_image, p_product_price, 1, p_product_price, 'Pending', p_user_name, p_user_email, p_delivery_phone, FALSE)
    RETURNING id INTO v_order_id;
    INSERT INTO transactions (user_id, type, amount, reference_id, metadata)
    VALUES (p_user_id, 'order', -p_product_price, v_order_id, jsonb_build_object('product_id', p_product_id, 'product_name', p_product_name))
    RETURNING id INTO v_transaction_id;
    UPDATE accounts SET total_orders = total_orders + p_product_price, updated_at = NOW() WHERE user_id = p_user_id;
    INSERT INTO immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'order_placed', jsonb_build_object('order_id', v_order_id, 'amount', p_product_price, 'timestamp', NOW()));
    RETURN QUERY SELECT TRUE, v_order_id, NULL::TEXT;
END; $$;
GRANT EXECUTE ON FUNCTION public.ledger_place_order TO service_role;

-- Done!
SELECT 'All 9 procedures created successfully!' as status;
