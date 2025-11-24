-- ============================================================================
-- REFERRAL COMMISSION SYSTEM - AWARD AND REVERSAL
-- ============================================================================
-- This file contains two main functions:
-- 1. award_referral_commission_if_applicable - Awards commission when invitee gets cashback or places order
-- 2. reverse_referral_commission_for_order - Reverses commission when order is cancelled
-- 
-- Commission rate is based on the referrer's loyalty level:
-- - advantage_referral_cashback: % when invitee gets cashback
-- - advantage_referral_store: % when invitee places order
-- ============================================================================

-- ============================================================================
-- PART 1: ADD COLUMN TO TRACK COMMISSION TRANSACTION ID
-- ============================================================================
-- This column stores the referral transaction ID so we can reverse it later
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS referral_commission_transaction_id UUID DEFAULT NULL;

COMMENT ON COLUMN orders.referral_commission_transaction_id IS 
'Transaction ID from ledger when referral commission was awarded. Used for reversal on cancellation.';

-- ============================================================================
-- PART 2: AWARD COMMISSION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION award_referral_commission_if_applicable(
  p_invitee_user_id UUID,           -- The user who triggered the action (invitee)
  p_action_type TEXT,                -- 'cashback' or 'order'
  p_base_amount NUMERIC(12, 2),      -- Amount of cashback or order total
  p_reference_id UUID,               -- ID of the cashback_transaction or order
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
  commission_awarded BOOLEAN,
  referrer_user_id UUID,
  commission_amount NUMERIC(12, 2),
  transaction_id UUID,
  event_id UUID,
  audit_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_level_id UUID;
  v_commission_percentage NUMERIC(5, 2);
  v_commission_amount NUMERIC(12, 2);
  v_transaction_id UUID;
  v_event_id UUID;
  v_audit_id UUID;
  v_new_total_earned NUMERIC(12, 2);
BEGIN
  -- Step 1: Find the referrer (who referred this invitee)
  SELECT referred_by INTO v_referrer_id
  FROM users
  WHERE id = p_invitee_user_id;
  
  -- If no referrer, no commission to award
  IF v_referrer_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'No referrer found'::TEXT;
    RETURN;
  END IF;
  
  -- Step 2: Get referrer's loyalty level
  SELECT level_id INTO v_referrer_level_id
  FROM users
  WHERE id = v_referrer_id;
  
  IF v_referrer_level_id IS NULL THEN
    RETURN QUERY SELECT FALSE, v_referrer_id, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Referrer has no level'::TEXT;
    RETURN;
  END IF;
  
  -- Step 3: Get commission percentage based on action type
  IF p_action_type = 'cashback' THEN
    SELECT advantage_referral_cashback INTO v_commission_percentage
    FROM client_levels
    WHERE id = v_referrer_level_id;
  ELSIF p_action_type = 'order' THEN
    SELECT advantage_referral_store INTO v_commission_percentage
    FROM client_levels
    WHERE id = v_referrer_level_id;
  ELSE
    RETURN QUERY SELECT FALSE, v_referrer_id, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Invalid action_type'::TEXT;
    RETURN;
  END IF;
  
  -- If percentage is 0 or NULL, no commission
  IF v_commission_percentage IS NULL OR v_commission_percentage = 0 THEN
    RETURN QUERY SELECT FALSE, v_referrer_id, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Commission percentage is 0'::TEXT;
    RETURN;
  END IF;
  
  -- Step 4: Calculate commission amount
  v_commission_amount := ROUND((p_base_amount * v_commission_percentage / 100), 2);
  
  -- If commission amount is 0, no commission
  IF v_commission_amount = 0 THEN
    RETURN QUERY SELECT FALSE, v_referrer_id, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Commission amount is 0'::TEXT;
    RETURN;
  END IF;
  
  -- Step 5: Award the commission using the existing ledger_add_referral function (ACID-safe)
  SELECT * INTO v_transaction_id, v_event_id, v_audit_id, v_new_total_earned
  FROM ledger_add_referral(
    v_referrer_id,
    v_commission_amount,
    p_reference_id,
    jsonb_build_object(
      'invitee_user_id', p_invitee_user_id,
      'action_type', p_action_type,
      'base_amount', p_base_amount,
      'commission_percentage', v_commission_percentage
    ),
    p_ip_address,
    p_user_agent
  );
  
  -- Return success
  RETURN QUERY SELECT TRUE, v_referrer_id, v_commission_amount, v_transaction_id, v_event_id, v_audit_id, NULL::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION award_referral_commission_if_applicable TO service_role;
GRANT EXECUTE ON FUNCTION award_referral_commission_if_applicable TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION award_referral_commission_if_applicable IS 
'Awards commission to referrer when invitee gets cashback or places order. Rate based on referrer loyalty level.';

-- ============================================================================
-- PART 3: REVERSE COMMISSION FUNCTION (FOR ORDER CANCELLATION)
-- ============================================================================
-- This function reverses the referral commission when an order is cancelled.
-- It reads the stored transaction_id from the order and uses ledger_reverse_referral.
-- ============================================================================

CREATE OR REPLACE FUNCTION reverse_referral_commission_for_order(
  p_order_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
  commission_reversed BOOLEAN,
  referrer_user_id UUID,
  commission_amount NUMERIC(12, 2),
  reversal_transaction_id UUID,
  event_id UUID,
  audit_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_original_transaction RECORD;
  v_reversal_transaction_id UUID;
  v_event_id UUID;
  v_audit_id UUID;
  v_new_total_earned NUMERIC(12, 2);
BEGIN
  -- Step 1: Get the order details
  SELECT 
    o.id,
    o.user_id,
    o.total_price,
    o.status,
    o.referral_commission_awarded,
    o.referral_commission_transaction_id
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id
  FOR UPDATE;
  
  -- Check if order exists
  IF v_order.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Order not found'::TEXT;
    RETURN;
  END IF;
  
  -- Check if commission was awarded
  IF v_order.referral_commission_awarded IS NOT TRUE THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'No commission was awarded for this order'::TEXT;
    RETURN;
  END IF;
  
  -- Check if we have the transaction ID
  IF v_order.referral_commission_transaction_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Commission transaction ID not found'::TEXT;
    RETURN;
  END IF;
  
  -- Step 2: Get the original transaction details to find referrer and amount
  SELECT 
    t.id,
    t.user_id,
    t.amount,
    t.reference_id,
    t.metadata
  INTO v_original_transaction
  FROM transactions t
  WHERE t.id = v_order.referral_commission_transaction_id;
  
  IF v_original_transaction.id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 0::NUMERIC(12, 2), NULL::UUID, NULL::UUID, NULL::UUID, 'Original transaction not found in ledger'::TEXT;
    RETURN;
  END IF;
  
  -- Step 3: Reverse the commission using existing ledger_reverse_referral function
  SELECT * INTO v_reversal_transaction_id, v_event_id, v_audit_id, v_new_total_earned
  FROM ledger_reverse_referral(
    v_original_transaction.user_id,  -- The referrer who received the commission
    v_original_transaction.amount,    -- The amount to reverse
    p_order_id,                       -- Reference to the cancelled order
    jsonb_build_object(
      'original_transaction_id', v_order.referral_commission_transaction_id,
      'order_id', p_order_id,
      'reason', 'Order cancelled',
      'original_metadata', v_original_transaction.metadata
    ),
    p_ip_address,
    p_user_agent
  );
  
  -- Step 4: Update the order to clear commission flags
  UPDATE orders
  SET 
    referral_commission_awarded = FALSE,
    referral_commission_transaction_id = NULL
  WHERE id = p_order_id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE, 
    v_original_transaction.user_id, 
    v_original_transaction.amount, 
    v_reversal_transaction_id, 
    v_event_id, 
    v_audit_id, 
    NULL::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reverse_referral_commission_for_order TO service_role;
GRANT EXECUTE ON FUNCTION reverse_referral_commission_for_order TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION reverse_referral_commission_for_order IS 
'Reverses referral commission when an order is cancelled. Uses stored transaction_id to identify and reverse the original commission.';
