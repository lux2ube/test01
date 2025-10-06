-- Migration to add document upload fields for KYC and Address verification
-- Run this in your Supabase SQL Editor

-- Add KYC document fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_document_front_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_back_url TEXT,
  ADD COLUMN IF NOT EXISTS kyc_full_name TEXT,
  ADD COLUMN IF NOT EXISTS kyc_date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS kyc_nationality TEXT,
  ADD COLUMN IF NOT EXISTS kyc_document_issue_date DATE,
  ADD COLUMN IF NOT EXISTS kyc_document_expiry_date DATE;

-- Add Address document fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address_document_url TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_state_province TEXT;

COMMENT ON COLUMN users.kyc_document_front_url IS 'URL to front side of ID/passport document';
COMMENT ON COLUMN users.kyc_document_back_url IS 'URL to back side of ID/passport document (if applicable)';
COMMENT ON COLUMN users.kyc_full_name IS 'Full name as shown on document';
COMMENT ON COLUMN users.kyc_date_of_birth IS 'Date of birth from document';
COMMENT ON COLUMN users.kyc_nationality IS 'Nationality/citizenship';
COMMENT ON COLUMN users.kyc_document_issue_date IS 'Document issue date';
COMMENT ON COLUMN users.kyc_document_expiry_date IS 'Document expiry date';
COMMENT ON COLUMN users.address_document_url IS 'URL to billing/address proof document';
COMMENT ON COLUMN users.address_postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN users.address_state_province IS 'State/Province/Region';
