-- ============================================================
-- STEP 0: Add 'deposit' to transaction_type enum
-- ============================================================
-- Run this FIRST before any other deposit migration steps
-- This adds the 'deposit' value to the existing enum
-- ============================================================

-- Add 'deposit' to the transaction_type enum
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'deposit';

-- Verify the enum now includes 'deposit'
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'transaction_type'::regtype
ORDER BY enumsortorder;
