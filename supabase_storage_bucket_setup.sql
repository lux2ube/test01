-- =====================================================
-- Supabase Storage Bucket Setup for Verification Documents
-- =====================================================
-- Run this script in Supabase SQL Editor to create the verification-documents bucket
-- and configure Row Level Security policies for secure file uploads
--
-- This allows:
-- 1. Authenticated users to upload/view their own verification documents
-- 2. Admin users to view all verification documents
-- =====================================================

-- Step 1: Create the verification-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents',
  'verification-documents',
  false, -- Private bucket for security
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create Storage Policies
-- Note: RLS is already enabled by default on storage.objects in Supabase

-- Policy 1: Allow authenticated users to upload their own verification documents
-- File path structure: {user_id}/kyc_front_{timestamp}.jpg
CREATE POLICY "Users can upload own verification docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow authenticated users to view/download their own verification documents
CREATE POLICY "Users can view own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow authenticated users to update their own verification documents
CREATE POLICY "Users can update own verification docs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow authenticated users to delete their own verification documents
CREATE POLICY "Users can delete own verification docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Allow admin users to view all verification documents
CREATE POLICY "Admins can view all verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 6: Allow admin users to delete any verification documents (for moderation)
CREATE POLICY "Admins can delete verification docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- Verification Complete
-- =====================================================
-- To verify the setup, run this query:
-- SELECT * FROM storage.buckets WHERE id = 'verification-documents';
--
-- Expected result: 1 row with bucket name 'verification-documents' and public = false
-- =====================================================
