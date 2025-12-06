-- ==================================================
-- WHITELIST PAYMENTS TABLE
-- ==================================================
-- Description: Stores approved payment methods and wallet addresses per user
-- When admin approves a withdrawal, the payment details are added to user's whitelist
-- Future withdrawals with whitelisted payment methods bypass extra scrutiny
-- ==================================================

CREATE TABLE IF NOT EXISTS whitelist_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(100) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    payment_details JSONB,
    approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_by_withdrawal_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_payment UNIQUE (user_id, payment_method, wallet_address)
);

CREATE INDEX idx_whitelist_payments_user_id ON whitelist_payments(user_id);
CREATE INDEX idx_whitelist_payments_active ON whitelist_payments(user_id, is_active);

CREATE OR REPLACE FUNCTION update_whitelist_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whitelist_payments_updated_at_trigger
    BEFORE UPDATE ON whitelist_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_whitelist_payments_updated_at();

-- ==================================================
-- ROW LEVEL SECURITY
-- ==================================================

ALTER TABLE whitelist_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY whitelist_payments_select_policy ON whitelist_payments
    FOR SELECT
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY whitelist_payments_insert_policy ON whitelist_payments
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY whitelist_payments_update_policy ON whitelist_payments
    FOR UPDATE
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY whitelist_payments_delete_policy ON whitelist_payments
    FOR DELETE
    USING (auth.role() = 'service_role');
