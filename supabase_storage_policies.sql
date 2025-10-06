-- =====================================================
-- Storage Policies for verification-documents Bucket
-- =====================================================
-- Run this in Supabase SQL Editor after creating the bucket
-- =====================================================

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
