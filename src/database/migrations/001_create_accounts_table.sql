-- Migration: Create accounts table
-- Description: Stores running totals for each user's financial activity
-- Created: 2025-11-22

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    total_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_pending_withdrawals NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_orders NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT accounts_user_id_unique UNIQUE (user_id),
    CONSTRAINT positive_total_earned CHECK (total_earned >= 0),
    CONSTRAINT positive_total_withdrawn CHECK (total_withdrawn >= 0),
    CONSTRAINT positive_total_pending_withdrawals CHECK (total_pending_withdrawals >= 0),
    CONSTRAINT positive_total_orders CHECK (total_orders >= 0)
);

-- Create index for faster lookups
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at_trigger
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_accounts_updated_at();

COMMENT ON TABLE accounts IS 'Stores running totals for user balances. Available balance is calculated as: total_earned - total_withdrawn - total_pending_withdrawals - total_orders';
COMMENT ON COLUMN accounts.total_earned IS 'Sum of all cashback and referral commissions';
COMMENT ON COLUMN accounts.total_withdrawn IS 'Sum of all completed withdrawals';
COMMENT ON COLUMN accounts.total_pending_withdrawals IS 'Sum of all processing withdrawals';
COMMENT ON COLUMN accounts.total_orders IS 'Sum of all active (non-cancelled) orders';
