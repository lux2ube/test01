-- Migration: Create transactions ledger table
-- Description: Unified ledger for all financial transactions
-- Created: 2025-11-22

-- Create transaction type enum
CREATE TYPE transaction_type AS ENUM (
    'cashback',
    'referral',
    'referral_reversed',
    'withdrawal_completed',
    'withdrawal_processing',
    'withdrawal_cancelled',
    'order_created',
    'order_cancelled'
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_amount CHECK (amount != 0)
);

-- Create indexes for faster queries
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own transactions
CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only service role can insert/update/delete
CREATE POLICY transactions_insert_policy ON transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY transactions_update_policy ON transactions
    FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY transactions_delete_policy ON transactions
    FOR DELETE
    USING (auth.role() = 'service_role');

COMMENT ON TABLE transactions IS 'Unified immutable ledger of all financial transactions';
COMMENT ON COLUMN transactions.type IS 'Type of transaction affecting user balance';
COMMENT ON COLUMN transactions.amount IS 'Amount in currency (positive or negative based on type)';
COMMENT ON COLUMN transactions.reference_id IS 'Reference to the original record (cashback_transactions, withdrawals, orders, etc.)';
COMMENT ON COLUMN transactions.metadata IS 'Additional context about the transaction';
