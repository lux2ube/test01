-- ==================================================
-- WHITELIST PAYMENTS TABLE - WITH PAYMENT SIGNATURE
-- ==================================================
-- Description: Stores approved payment methods and wallet addresses per user
-- When admin approves a withdrawal, the payment details are added to user's whitelist
-- Future withdrawals with whitelisted payment methods bypass extra scrutiny
-- ==================================================

-- Create table if it doesn't exist (initial schema)
CREATE TABLE IF NOT EXISTS whitelist_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(100) NOT NULL,
    wallet_address VARCHAR(255),
    payment_signature VARCHAR(500),
    payment_details JSONB,
    approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    approved_by_withdrawal_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add payment_signature column if it doesn't exist (for existing installations)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'whitelist_payments' 
        AND column_name = 'payment_signature'
    ) THEN
        ALTER TABLE whitelist_payments ADD COLUMN payment_signature VARCHAR(500);
    END IF;
END $$;

-- Backfill payment_signature for existing rows that don't have it
-- Uses key=value|key=value format matching TypeScript createPaymentSignature exactly
-- Keys are lowercased, VALUES ARE PRESERVED EXACTLY for security (case-sensitive wallets)
-- Numbers are cast to numeric then to text to normalize formatting (1.0 -> 1, 01 -> 1)
UPDATE whitelist_payments
SET payment_signature = COALESCE(
    (
        SELECT string_agg(
            LOWER(key) || '=' || TRIM(COALESCE(
                CASE 
                    WHEN jsonb_typeof(value) = 'string' THEN value #>> '{}'
                    WHEN jsonb_typeof(value) = 'null' THEN ''
                    WHEN jsonb_typeof(value) = 'number' THEN (value::text)::numeric::text
                    WHEN jsonb_typeof(value) = 'boolean' THEN value::text
                    ELSE value::text
                END,
                ''
            )),
            '|' ORDER BY LOWER(key)
        )
        FROM jsonb_each(COALESCE(payment_details, '{}'::jsonb))
    ),
    ''
)
WHERE payment_signature IS NULL OR payment_signature = '';

-- Make payment_signature NOT NULL after backfill
ALTER TABLE whitelist_payments ALTER COLUMN payment_signature SET NOT NULL;

-- Drop old unique constraint if it exists
ALTER TABLE whitelist_payments DROP CONSTRAINT IF EXISTS unique_user_payment;

-- Add new unique constraint on payment_signature
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_constraint 
        WHERE conname = 'unique_user_payment_signature'
    ) THEN
        ALTER TABLE whitelist_payments 
        ADD CONSTRAINT unique_user_payment_signature 
        UNIQUE (user_id, payment_method, payment_signature);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_whitelist_payments_user_id ON whitelist_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_whitelist_payments_active ON whitelist_payments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_whitelist_payments_signature ON whitelist_payments(payment_signature);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_whitelist_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS whitelist_payments_updated_at_trigger ON whitelist_payments;
CREATE TRIGGER whitelist_payments_updated_at_trigger
    BEFORE UPDATE ON whitelist_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_whitelist_payments_updated_at();

-- ==================================================
-- ROW LEVEL SECURITY
-- ==================================================

ALTER TABLE whitelist_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whitelist_payments_select_policy ON whitelist_payments;
DROP POLICY IF EXISTS whitelist_payments_insert_policy ON whitelist_payments;
DROP POLICY IF EXISTS whitelist_payments_update_policy ON whitelist_payments;
DROP POLICY IF EXISTS whitelist_payments_delete_policy ON whitelist_payments;

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

-- ==================================================
-- COMMENTS
-- ==================================================
COMMENT ON TABLE whitelist_payments IS 'Stores approved payment destinations per user. When admin approves a withdrawal, the complete payment details are saved here. Future withdrawals are checked against this list.';
COMMENT ON COLUMN whitelist_payments.payment_signature IS 'Deterministic signature created from all payment details fields (sorted key:value pairs). Used for exact matching of complete payment destinations.';
COMMENT ON COLUMN whitelist_payments.wallet_address IS 'Primary identifier (wallet address, account number, etc.) for display purposes only. The payment_signature is used for matching.';
COMMENT ON COLUMN whitelist_payments.payment_details IS 'Complete JSONB of all payment fields submitted (wallet, network, memo, tag, etc.)';
