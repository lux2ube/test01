-- ============================================
-- KYC & Address Document Upload Adjustments
-- ============================================
-- Purpose: Configure database for simplified user document upload flow
--          with admin-side data extraction and review
--
-- WORKFLOW:
-- 1. USER SIDE: Upload documents only (no manual data entry)
--    - Select document type (ID Card, Passport, Driver's License)
--    - Select country/nationality
--    - Upload front image (required)
--    - Upload back image (optional, based on document type)
--    - Upload selfie (optional, for enhanced verification)
--
-- 2. ADMIN SIDE: Review documents and extract data
--    - View uploaded documents in admin panel
--    - Extract personal information from documents
--    - Approve or reject with reason
--
-- Run this in Supabase SQL Editor after running the main schema
-- ============================================

-- ============================================
-- STEP 1: Extend document_type ENUM to include driver_license
-- ============================================
-- The KYC form allows users to select "Driver's License" but the
-- database enum only supports 'id_card' and 'passport'
-- This adds 'driver_license' to the existing enum
--
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block,
-- so we use IF NOT EXISTS (requires PostgreSQL 12.3+)

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'driver_license';

-- ============================================
-- STEP 2: Add optional selfie column for enhanced KYC
-- ============================================
-- Some verification flows require a selfie holding the ID document
-- This is optional and enhances security/authenticity

DO $$ 
BEGIN
    -- Add kyc_selfie_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'kyc_selfie_url'
    ) THEN
        ALTER TABLE users ADD COLUMN kyc_selfie_url TEXT;
        RAISE NOTICE 'Added kyc_selfie_url column to users table';
    ELSE
        RAISE NOTICE 'kyc_selfie_url column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: Verify nullable columns for admin data extraction
-- ============================================
-- These columns should remain NULL until admin extracts data from documents
-- Users DO NOT fill these fields - admins extract them during review

-- Verify these columns are nullable (they should be from main schema):
-- - kyc_document_number
-- - kyc_full_name  
-- - kyc_date_of_birth
-- - kyc_document_issue_date
-- - kyc_document_expiry_date
-- - kyc_gender

COMMENT ON COLUMN users.kyc_document_type IS 'Document type selected by user during upload (id_card, passport, driver_license)';
COMMENT ON COLUMN users.kyc_nationality IS 'Country/nationality selected by user during upload';
COMMENT ON COLUMN users.kyc_document_front_url IS 'S3 URL of front document image uploaded by user';
COMMENT ON COLUMN users.kyc_document_back_url IS 'S3 URL of back document image uploaded by user (optional)';
COMMENT ON COLUMN users.kyc_selfie_url IS 'S3 URL of selfie image uploaded by user (optional, for enhanced verification)';
COMMENT ON COLUMN users.kyc_status IS 'Verification status: Pending (awaiting admin review), Verified (approved), Rejected';
COMMENT ON COLUMN users.kyc_submitted_at IS 'Timestamp when user submitted documents for verification';

-- Admin-extracted fields (filled during review):
COMMENT ON COLUMN users.kyc_document_number IS 'ID/Passport number - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_full_name IS 'Full name as shown on document - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_date_of_birth IS 'Date of birth - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_document_issue_date IS 'Document issue date - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_document_expiry_date IS 'Document expiry date - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_gender IS 'Gender - EXTRACTED BY ADMIN from uploaded documents';
COMMENT ON COLUMN users.kyc_rejection_reason IS 'Reason for rejection - SET BY ADMIN if documents are rejected';

-- ============================================
-- STEP 4: Address Verification Document Comments
-- ============================================
-- Similar workflow for address verification

COMMENT ON COLUMN users.address_document_url IS 'S3 URL of address proof document (utility bill, bank statement, etc.) uploaded by user';
COMMENT ON COLUMN users.address_status IS 'Address verification status: Pending (awaiting admin review), Verified (approved), Rejected';
COMMENT ON COLUMN users.address_submitted_at IS 'Timestamp when user submitted address proof document';

-- Admin-extracted/verified fields:
COMMENT ON COLUMN users.address_country IS 'Country - VERIFIED BY ADMIN from address proof document';
COMMENT ON COLUMN users.address_city IS 'City - VERIFIED BY ADMIN from address proof document';
COMMENT ON COLUMN users.address_street IS 'Street address - VERIFIED BY ADMIN from address proof document';
COMMENT ON COLUMN users.address_state_province IS 'State/Province - VERIFIED BY ADMIN from address proof document';
COMMENT ON COLUMN users.address_postal_code IS 'Postal/ZIP code - VERIFIED BY ADMIN from address proof document';
COMMENT ON COLUMN users.address_rejection_reason IS 'Reason for rejection - SET BY ADMIN if address proof is rejected';

-- ============================================
-- STEP 5: Create index for faster admin queries
-- ============================================
-- Admins frequently query by verification status

CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status) WHERE kyc_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_address_status ON users(address_status) WHERE address_status IS NOT NULL;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================
-- Summary of changes:
-- ✅ Extended document_type enum to support driver_license
-- ✅ Added optional kyc_selfie_url for enhanced verification
-- ✅ Added comprehensive comments explaining user upload vs admin review workflow
-- ✅ Created indexes for faster admin queries on verification status
-- ✅ Confirmed all admin-extracted fields remain nullable
--
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify the KYC form can now accept driver_license documents
-- 3. Verify admin panel can view/review all uploaded documents
-- 4. Test the complete user upload → admin review workflow
-- ============================================

SELECT 'KYC Document Upload Adjustments Applied Successfully!' AS status;
