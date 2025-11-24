-- ============================================================================
-- SIMPLIFIED ORDER SYSTEM: 3 Statuses Only
-- ============================================================================
-- Statuses: Processing, Confirmed, Cancelled
-- 
-- Logic:
-- 1. User submits order → "Processing" → total_orders INCREASES
-- 2. Admin confirms → "Confirmed" → NO CHANGE to total_orders
-- 3. Admin cancels → "Cancelled" → total_orders DECREASES
-- 4. Cannot cancel "Confirmed" orders
-- 5. Cannot confirm "Cancelled" orders
-- ============================================================================

DROP FUNCTION IF EXISTS public.ledger_change_order_status(UUID, UUID, VARCHAR, VARCHAR, NUMERIC, JSONB, UUID, VARCHAR);

CREATE OR REPLACE FUNCTION public.ledger_change_order_status(
    p_user_id UUID,
    p_reference_id UUID,
    p_old_status VARCHAR,
    p_new_status VARCHAR,
    p_amount NUMERIC,
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
    v_transaction_type TEXT;
    v_transaction_amount NUMERIC;
BEGIN
    -- Validate status change
    IF p_old_status = p_new_status THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Old status and new status cannot be the same'::TEXT;
        RETURN;
    END IF;

    -- RULE: Cannot cancel a Confirmed order
    IF p_old_status IN ('Confirmed', 'confirmed') AND p_new_status IN ('Cancelled', 'cancelled') THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Cannot cancel a confirmed order'::TEXT;
        RETURN;
    END IF;

    -- RULE: Cannot confirm a Cancelled order
    IF p_old_status IN ('Cancelled', 'cancelled') AND p_new_status IN ('Confirmed', 'confirmed') THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Cannot confirm a cancelled order'::TEXT;
        RETURN;
    END IF;

    -- Determine transaction type and amount
    IF p_new_status IN ('Cancelled', 'cancelled') AND p_old_status NOT IN ('Cancelled', 'cancelled') THEN
        -- Cancelling order: return funds (positive transaction)
        v_transaction_type := 'order_cancelled';
        v_transaction_amount := p_amount;
    ELSIF p_new_status IN ('Confirmed', 'confirmed') AND p_old_status NOT IN ('Confirmed', 'confirmed') THEN
        -- Confirming order: no balance change, just log it
        v_transaction_type := 'order_created';
        v_transaction_amount := 0.01; -- Tiny placeholder to satisfy valid_amount constraint
    ELSE
        -- Other transitions (shouldn't happen with 3-status system)
        v_transaction_type := 'order_created';
        v_transaction_amount := 0.01;
    END IF;

    -- Insert transaction
    INSERT INTO public.transactions (user_id, type, amount, reference_id, metadata)
    VALUES (
        p_user_id,
        v_transaction_type::transaction_type,
        v_transaction_amount,
        p_reference_id,
        coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object(
            'old_status', p_old_status,
            'new_status', p_new_status,
            'original_amount', p_amount,
            'actor_id', p_actor_id,
            'actor_action', p_actor_action,
            'is_status_change_only', (v_transaction_amount = 0.01)
        )
    )
    RETURNING id INTO v_transaction_id;

    -- Update account balances ONLY when cancelling
    IF p_new_status IN ('Cancelled', 'cancelled') AND p_old_status NOT IN ('Cancelled', 'cancelled') THEN
        UPDATE public.accounts
        SET total_orders = GREATEST(0, total_orders - p_amount),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;

    -- Log immutable event
    INSERT INTO public.immutable_events (transaction_id, event_type, event_data)
    VALUES (v_transaction_id, 'order_status_changed', jsonb_build_object(
        'user_id', p_user_id,
        'order_id', p_reference_id,
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

GRANT EXECUTE ON FUNCTION public.ledger_change_order_status TO service_role;

-- ============================================================================
-- Update ledger_place_order to use "Processing" status
-- ============================================================================
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
  
  -- Change status from 'Pending' to 'Processing'
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
    'Processing',  -- Changed from 'Pending' to 'Processing'
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
      'order_status', 'Processing',
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

COMMENT ON FUNCTION ledger_place_order IS 'Atomically places an order with Processing status';
