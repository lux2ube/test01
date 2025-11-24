-- ============================================================================
-- SIMPLIFIED ORDER SYSTEM: 3 Statuses Only (COMPLETE FIX)
-- ============================================================================
-- Statuses: Processing, Confirmed, Cancelled
-- 
-- Logic:
-- 1. User submits order → "Processing" → total_orders INCREASES, stock DECREASES
-- 2. Admin confirms → "Confirmed" → NO CHANGE to total_orders or stock
-- 3. Admin cancels → "Cancelled" → total_orders DECREASES, stock INCREASES (restored)
-- 4. Cannot cancel "Confirmed" orders
-- 5. Cannot confirm "Cancelled" orders
-- ============================================================================

-- ============================================================================
-- PART 1: DROP ALL EXISTING FUNCTION VERSIONS
-- ============================================================================
DROP FUNCTION IF EXISTS public.ledger_change_order_status(p_user_id UUID, p_reference_id UUID, p_old_status VARCHAR, p_new_status VARCHAR, p_amount NUMERIC, p_metadata JSONB, p_actor_id UUID, p_actor_action VARCHAR);
DROP FUNCTION IF EXISTS public.ledger_change_order_status(UUID, UUID, VARCHAR, VARCHAR, NUMERIC, JSONB, UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.ledger_change_order_status;

DROP FUNCTION IF EXISTS ledger_place_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS ledger_place_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS ledger_place_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS ledger_place_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS ledger_place_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS ledger_place_order;

-- ============================================================================
-- PART 2: CREATE ledger_change_order_status (with stock management)
-- ============================================================================
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
    v_product_id UUID;
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

    -- Get product_id from the order
    SELECT product_id INTO v_product_id
    FROM orders
    WHERE id = p_reference_id;

    -- Determine transaction type and amount
    IF p_new_status IN ('Cancelled', 'cancelled') AND p_old_status NOT IN ('Cancelled', 'cancelled') THEN
        -- Cancelling order: return funds (positive transaction)
        v_transaction_type := 'order_cancelled';
        v_transaction_amount := p_amount;
        
        -- STOCK MANAGEMENT: Restore stock when cancelling
        IF v_product_id IS NOT NULL THEN
            UPDATE products
            SET stock = stock + 1
            WHERE id = v_product_id;
        END IF;
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
            'is_status_change_only', (v_transaction_amount = 0.01),
            'stock_restored', (v_product_id IS NOT NULL AND p_new_status IN ('Cancelled', 'cancelled'))
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
        'product_id', v_product_id,
        'stock_restored', (v_product_id IS NOT NULL AND p_new_status IN ('Cancelled', 'cancelled')),
        'timestamp', NOW()
    ));

    RETURN QUERY SELECT TRUE, v_transaction_id, NULL::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ledger_change_order_status TO service_role;

-- ============================================================================
-- PART 3: CREATE ledger_place_order (with ALL required columns)
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
  v_quantity INTEGER := 1;
  v_total_price NUMERIC;
BEGIN
  -- Calculate total price (price * quantity)
  v_total_price := p_product_price * v_quantity;

  -- Check product stock
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
  
  -- Check user balance
  SELECT 
    total_earned - total_withdrawn - total_pending_withdrawals - total_orders
  INTO v_available_balance
  FROM accounts
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_available_balance IS NULL OR v_available_balance < v_total_price THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::UUID, FALSE, 'Insufficient balance';
    RETURN;
  END IF;
  
  -- Decrease stock
  UPDATE products
  SET stock = stock - 1
  WHERE id = p_product_id;
  
  v_new_order_id := gen_random_uuid();
  
  -- Get account state before
  SELECT to_jsonb(a.*) INTO v_account_before
  FROM accounts a
  WHERE a.user_id = p_user_id;
  
  -- Insert order with ALL required columns
  INSERT INTO orders (
    id,
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
    referral_commission_awarded,
    created_at,
    updated_at
  )
  VALUES (
    v_new_order_id,
    p_user_id,
    p_product_id,
    p_product_name,
    p_product_image,
    p_product_price,
    v_quantity,
    v_total_price,
    'Processing',
    p_user_name,
    p_user_email,
    p_delivery_phone,
    FALSE,
    NOW(),
    NOW()
  );
  
  -- Create transaction
  INSERT INTO transactions (user_id, type, amount, reference_id, metadata, created_at)
  VALUES (
    p_user_id,
    'order_created',
    -v_total_price,
    v_new_order_id::TEXT,
    jsonb_build_object(
      'product_id', p_product_id,
      'product_name', p_product_name,
      'order_status', 'Processing',
      'quantity', v_quantity,
      'total_price', v_total_price,
      '_actor_id', p_actor_id,
      '_actor_action', p_actor_action
    ),
    NOW()
  )
  RETURNING id INTO v_transaction_id;
  
  -- Create immutable event
  INSERT INTO immutable_events (transaction_id, event_type, event_data, created_at)
  VALUES (
    v_transaction_id,
    'ORDER_CREATED',
    jsonb_build_object(
      'user_id', p_user_id,
      'amount', v_total_price,
      'reference_id', v_new_order_id::TEXT,
      'product_id', p_product_id,
      'product_name', p_product_name,
      'quantity', v_quantity
    ),
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  -- Update account balances
  UPDATE accounts
  SET 
    total_orders = total_orders + v_total_price,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Get account state after
  SELECT to_jsonb(a.*) INTO v_account_after
  FROM accounts a
  WHERE a.user_id = p_user_id;
  
  -- Create audit log
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

GRANT EXECUTE ON FUNCTION ledger_place_order TO service_role;

COMMENT ON FUNCTION ledger_place_order IS 'Atomically places an order with Processing status, includes all required columns (quantity, total_price, timestamps)';
COMMENT ON FUNCTION public.ledger_change_order_status IS 'Changes order status with balance/stock management: Processing→Confirmed (no change), Processing→Cancelled (refund+restore stock)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Test order placement (should work without NULL errors)
-- 2. Test order confirmation (balance stays same, commission awarded)
-- 3. Test order cancellation (balance restored, stock restored)
-- 4. Verify cannot cancel confirmed orders
-- ============================================================================
