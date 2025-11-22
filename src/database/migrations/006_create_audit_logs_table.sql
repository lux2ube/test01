-- Migration: Create audit logs table
-- Description: Tracks admin and system actions for compliance
-- Created: 2025-11-22

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

-- Create indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role and admins can read audit logs
CREATE POLICY audit_logs_select_policy ON audit_logs
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Policy: Only service role can insert
CREATE POLICY audit_logs_insert_policy ON audit_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- No updates or deletes allowed
CREATE POLICY audit_logs_no_update ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY audit_logs_no_delete ON audit_logs
    FOR DELETE
    USING (false);

COMMENT ON TABLE audit_logs IS 'Audit trail of admin and system actions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., USER_UPDATED, WITHDRAWAL_APPROVED)';
COMMENT ON COLUMN audit_logs.before IS 'State before the action';
COMMENT ON COLUMN audit_logs.after IS 'State after the action';
