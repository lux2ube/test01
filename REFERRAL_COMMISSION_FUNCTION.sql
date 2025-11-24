-- ============================================================================
-- REFERRAL COMMISSION AUTOMATION FUNCTION
-- ============================================================================
-- This function awards commission to the referrer when their invitee:
-- 1. Receives cashback
-- 2. Places an order
-- 
-- Commission rate is based on the referrer's loyalty level:
-- - advantage_referral_cashback: % when invitee gets cashback
-- - advantage_referral_store: % when invitee places order
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
