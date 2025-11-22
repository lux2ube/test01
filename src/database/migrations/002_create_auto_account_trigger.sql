-- Migration: Auto-create account when user is created
-- Description: Trigger function to automatically create an account row when a new user is added
-- Created: 2025-11-22

CREATE OR REPLACE FUNCTION create_account_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create account if it doesn't already exist
    INSERT INTO accounts (user_id, total_earned, total_withdrawn, total_pending_withdrawals, total_orders)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires AFTER user insert
CREATE TRIGGER auto_create_account_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_account_for_new_user();

COMMENT ON FUNCTION create_account_for_new_user() IS 'Automatically creates an account record when a new user is created. Uses ON CONFLICT to prevent duplicates.';
