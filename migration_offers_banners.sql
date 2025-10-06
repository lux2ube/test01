-- Migration to fix offers and banner_settings tables
-- Run this in your Supabase SQL Editor

-- Update banner_settings table
ALTER TABLE banner_settings 
  DROP COLUMN IF EXISTS message,
  DROP COLUMN IF EXISTS link;

ALTER TABLE banner_settings
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_link TEXT,
  ADD COLUMN IF NOT EXISTS script_code TEXT,
  ADD COLUMN IF NOT EXISTS target_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS target_statuses TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update offers table
ALTER TABLE offers
  DROP COLUMN IF EXISTS discount_percentage,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS target_user_ids,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS expires_at;

ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS cta_text TEXT,
  ADD COLUMN IF NOT EXISTS cta_link TEXT,
  ADD COLUMN IF NOT EXISTS script_code TEXT,
  ADD COLUMN IF NOT EXISTS target_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS target_countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS target_statuses TEXT[] DEFAULT ARRAY[]::TEXT[];
