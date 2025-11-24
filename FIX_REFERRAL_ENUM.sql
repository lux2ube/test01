-- ============================================================================
-- FIX: Add missing enum values to transaction_type
-- ============================================================================
-- Run this in Supabase SQL Editor to fix the referral commission error

-- Add 'referral_commission' to the enum (if not exists)
DO $$ BEGIN
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'referral_commission';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add 'referral_reversal' to the enum (if not exists)
DO $$ BEGIN
    ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'referral_reversal';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Verify the fix
SELECT enumlabel FROM pg_enum 
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
WHERE pg_type.typname = 'transaction_type';
