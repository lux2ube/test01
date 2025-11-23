-- Migration 009: Create atomic order placement procedure
-- This procedure wraps stock verification, decrement, order creation, and ledger mutation
-- in a single ACID-compliant transaction

CREATE OR REPLACE FUNCTION ledger_place_order(
  p_user_id UUID,
  p_product_id UUID,
  p_product_name TEXT,
  p_product_image TEXT,
  p_product_price NUMERIC,
  p_user_name TEXT,
  p_user_email TEXT,
  p_delivery_phone TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_action TEXT DEFAULT 'user_place_order',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
  order_id UUID,
  transaction_id UUID,
  event_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_stock INTEGER;
  v_available_balance NUMERIC;
  v_new_order_id UUID;
  v_transaction_id UUID;
  v_event_id UUID;
  v_audit_id UUID;
  v_account_before JSONB;
  v_account_after JSONB;
BEGIN
  SELECT stock INTO v_product_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, FALSE, 'Product not found';
    RETURN;
  END IF;
  
  IF v_product_stock < 1 THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, FALSE, 'Product out of stock';
    RETURN;
  END IF;
  
  SELECT 
    total_earned - total_withdrawn - total_pending_withdrawals - total_orders
  INTO v_available_balance
  FROM accounts
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_available_balance IS NULL OR v_available_balance < p_product_price THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, FALSE, 'Insufficient balance';
    RETURN;
  END IF;
  
  UPDATE products
  SET stock = stock - 1
  WHERE id = p_product_id;
  
  v_new_order_id := gen_random_uuid();
  
  INSERT INTO orders (
    id,
    user_id,
    product_id,
    product_name,
    product_image,
    product_price,
    status,
    user_name,
    user_email,
    delivery_phone_number,
    referral_commission_awarded,
    created_at
  )
  VALUES (
    v_new_order_id,
    p_user_id,
    p_product_id,
    p_product_name,
    p_product_image,
    p_product_price,
    'Pending',
    p_user_name,
    p_user_email,
    p_delivery_phone,
    FALSE,
    NOW()
  );
  
  SELECT to_jsonb(a.*) INTO v_account_before
  FROM accounts a
  WHERE a.user_id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, reference_id, metadata, created_at)
  VALUES (
    p_user_id,
    'order_created',
    -p_product_price,
    v_new_order_id::TEXT,
    jsonb_build_object(
      'product_id', p_product_id,
      'product_name', p_product_name,
      'order_status', 'Pending',
      '_actor_id', p_actor_id,
      '_actor_action', p_actor_action
    ),
    NOW()
  )
  RETURNING id INTO v_transaction_id;
  
  INSERT INTO immutable_events (transaction_id, event_type, event_data, created_at)
  VALUES (
    v_transaction_id,
    'ORDER_CREATED',
    jsonb_build_object(
      'user_id', p_user_id,
      'amount', p_product_price,
      'reference_id', v_new_order_id::TEXT,
      'product_id', p_product_id,
      'product_name', p_product_name
    ),
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  UPDATE accounts
  SET 
    total_orders = total_orders + p_product_price,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  SELECT to_jsonb(a.*) INTO v_account_after
  FROM accounts a
  WHERE a.user_id = p_user_id;
  
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    before,
    after,
    ip_address,
    user_agent,
    created_at
  )
  VALUES (
    p_user_id,
    'ORDER_CREATED',
    'orders',
    v_new_order_id::TEXT,
    v_account_before,
    v_account_after,
    p_ip_address,
    p_user_agent,
    NOW()
  )
  RETURNING id INTO v_audit_id;
  
  RETURN QUERY SELECT v_new_order_id, v_transaction_id, v_event_id, TRUE, NULL::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in ledger_place_order: %', SQLERRM;
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, FALSE, SQLERRM;
END;
$$;

COMMENT ON FUNCTION ledger_place_order IS 'Atomically places an order: verifies stock and balance, decrements inventory, creates order record, and records ledger entry in a single transaction';
