import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API Upload route called');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ Upload failed: User not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('👤 User authenticated:', user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as 'kyc_front' | 'kyc_back' | 'kyc_selfie' | 'address_proof';

    if (!file) {
      console.error('❌ Upload failed: No file provided');
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      console.error('❌ Upload failed: No document type provided');
      return NextResponse.json(
        { success: false, error: 'Document type required' },
        { status: 400 }
      );
    }

    console.log('📁 File received:', {
      name: file.name,
      size: file.size,
      type: file.type,
      documentType
    });

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed');

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${documentType}_${timestamp}.${ext}`;

    console.log('📤 Uploading to Supabase Storage:', fileName);

    // Upload to Supabase Storage (native client, no SSL issues)
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(fileName);

    console.log('✅ Upload successful:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl
    });

  } catch (error) {
    console.error('❌ Error in upload API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
