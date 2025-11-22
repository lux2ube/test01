-- ==================================================
-- FINANCIAL LEDGER SYSTEM - COMPLETE DATABASE SCHEMA
-- ==================================================
-- Description: A financial-grade double-entry ledger system
-- Created: 2025-11-22
-- Author: System
--
-- This schema implements:
-- - Running totals in accounts table
-- - Immutable transaction ledger
-- - Audit trails
-- - Row-level security
-- - Automatic account creation
-- ==================================================

-- ==================================================
-- PART 1: CREATE ACCOUNTS TABLE
-- ==================================================

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

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

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

-- ==================================================
-- PART 2: AUTO-CREATE ACCOUNT TRIGGER
-- ==================================================

CREATE OR REPLACE FUNCTION create_account_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO accounts (user_id, total_earned, total_withdrawn, total_pending_withdrawals, total_orders)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_account_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_account_for_new_user();

-- ==================================================
-- PART 3: ROW LEVEL SECURITY FOR ACCOUNTS
-- ==================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_select_policy ON accounts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY accounts_insert_policy ON accounts
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY accounts_update_policy ON accounts
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY accounts_delete_policy ON accounts
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ==================================================
-- PART 4: CREATE TRANSACTIONS TABLE
-- ==================================================

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

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_reference_id ON transactions(reference_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY transactions_insert_policy ON transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY transactions_update_policy ON transactions
    FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY transactions_delete_policy ON transactions
    FOR DELETE
    USING (auth.role() = 'service_role');

-- ==================================================
-- PART 5: CREATE IMMUTABLE EVENTS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS immutable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_immutable_events_transaction_id ON immutable_events(transaction_id);
CREATE INDEX idx_immutable_events_event_type ON immutable_events(event_type);
CREATE INDEX idx_immutable_events_created_at ON immutable_events(created_at DESC);

ALTER TABLE immutable_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY immutable_events_select_policy ON immutable_events
    FOR SELECT
    USING (auth.role() = 'service_role');

CREATE POLICY immutable_events_insert_policy ON immutable_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY immutable_events_no_update ON immutable_events
    FOR UPDATE
    USING (false);

CREATE POLICY immutable_events_no_delete ON immutable_events
    FOR DELETE
    USING (false);

-- ==================================================
-- PART 6: CREATE AUDIT LOGS TABLE
-- ==================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    before JSONB,
    after JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY audit_logs_no_update ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY audit_logs_no_delete ON audit_logs
    FOR DELETE
    USING (false);

-- ==================================================
-- PART 7: COMMENTS FOR DOCUMENTATION
-- ==================================================

COMMENT ON TABLE accounts IS 'Stores running totals for user balances. Available balance = total_earned - total_withdrawn - total_pending_withdrawals - total_orders';
COMMENT ON COLUMN accounts.total_earned IS 'Sum of all cashback and referral commissions';
COMMENT ON COLUMN accounts.total_withdrawn IS 'Sum of all completed withdrawals';
COMMENT ON COLUMN accounts.total_pending_withdrawals IS 'Sum of all processing withdrawals';
COMMENT ON COLUMN accounts.total_orders IS 'Sum of all active (non-cancelled) orders';

COMMENT ON TABLE transactions IS 'Unified immutable ledger of all financial transactions';
COMMENT ON COLUMN transactions.type IS 'Type of transaction affecting user balance';
COMMENT ON COLUMN transactions.amount IS 'Amount in currency (positive or negative based on type)';
COMMENT ON COLUMN transactions.reference_id IS 'Reference to original record (cashback_transactions, withdrawals, orders, etc.)';

COMMENT ON TABLE immutable_events IS 'Immutable audit log of all transaction events - cannot be modified or deleted';
COMMENT ON COLUMN immutable_events.event_type IS 'Type of event (e.g., CASHBACK_ADDED, WITHDRAWAL_COMPLETED)';
COMMENT ON COLUMN immutable_events.event_data IS 'Complete snapshot of event data for audit purposes';

COMMENT ON TABLE audit_logs IS 'Audit trail of admin and system actions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., USER_UPDATED, WITHDRAWAL_APPROVED)';
COMMENT ON COLUMN audit_logs.before IS 'State before the action';
COMMENT ON COLUMN audit_logs.after IS 'State after the action';

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
