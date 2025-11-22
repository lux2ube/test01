-- Migration: Create immutable events audit table
-- Description: Permanent audit history of all transaction events
-- Created: 2025-11-22

CREATE TABLE IF NOT EXISTS immutable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_immutable_events_transaction_id ON immutable_events(transaction_id);
CREATE INDEX idx_immutable_events_event_type ON immutable_events(event_type);
CREATE INDEX idx_immutable_events_created_at ON immutable_events(created_at DESC);

-- Enable RLS
ALTER TABLE immutable_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can read events
CREATE POLICY immutable_events_select_policy ON immutable_events
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Policy: Only service role can insert events (no updates or deletes - immutable)
CREATE POLICY immutable_events_insert_policy ON immutable_events
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Prevent updates and deletes entirely
CREATE POLICY immutable_events_no_update ON immutable_events
    FOR UPDATE
    USING (false);

CREATE POLICY immutable_events_no_delete ON immutable_events
    FOR DELETE
    USING (false);

COMMENT ON TABLE immutable_events IS 'Immutable audit log of all transaction events - cannot be modified or deleted';
COMMENT ON COLUMN immutable_events.event_type IS 'Type of event (e.g., CASHBACK_ADDED, WITHDRAWAL_COMPLETED)';
COMMENT ON COLUMN immutable_events.event_data IS 'Complete snapshot of event data for audit purposes';
