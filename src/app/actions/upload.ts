'use server';

import { uploadDocument, validateDocumentFile } from '@/lib/storage';
import { createClient } from '@/lib/supabase/server';

export async function uploadVerificationDocument(
  formData: FormData,
  documentType: 'kyc_front' | 'kyc_back' | 'address_proof'
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Upload failed: User not authenticated');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('👤 User authenticated for upload:', user.id);

    const file = formData.get('file') as File;
    if (!file) {
      console.error('❌ Upload failed: No file provided');
      return { success: false, error: 'No file provided' };
    }

    console.log('📁 File received:', { name: file.name, size: file.size, type: file.type });

    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      console.error('❌ Validation failed:', validation.error);
      return { success: false, error: validation.error };
    }

    console.log('✅ File validation passed');

    const result = await uploadDocument(file, user.id, documentType);
    
    if (result.success) {
      console.log('✅ Upload completed successfully:', result.url);
    } else {
      console.error('❌ Upload failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error in uploadVerificationDocument:', error);
    return { success: false, error: 'Failed to upload document' };
  }
}
