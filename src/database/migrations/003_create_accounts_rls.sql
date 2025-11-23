-- Migration: Add RLS policies for accounts table
-- Description: Users can only read their own account, only service role can update totals
-- Created: 2025-11-23

-- Enable RLS
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own account
CREATE POLICY accounts_select_policy ON accounts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Only service role can insert accounts (normally done by trigger)
CREATE POLICY accounts_insert_policy ON accounts
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy: Only service role can update totals
CREATE POLICY accounts_update_policy ON accounts
    FOR UPDATE
    USING (auth.role() = 'service_role');

-- Policy: No deletes allowed (accounts are permanent)
CREATE POLICY accounts_no_delete ON accounts
    FOR DELETE
    USING (false);

COMMENT ON POLICY accounts_select_policy ON accounts IS 'Users can only view their own account balance';
COMMENT ON POLICY accounts_update_policy ON accounts IS 'Only backend service role can update account totals';
