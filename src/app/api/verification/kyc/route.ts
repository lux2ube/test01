import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      documentType,
      nationality,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    } = body;

    // Update user's KYC data - personal info will be extracted by admin later
    const { error } = await supabase
      .from('users')
      .update({
        kyc_document_type: documentType,
        kyc_nationality: nationality,
        kyc_document_front_url: documentFrontUrl,
        kyc_document_back_url: documentBackUrl,
        kyc_selfie_url: selfieUrl,
        kyc_status: 'Pending',
        kyc_submitted_at: new Date().toISOString(),
        kyc_rejection_reason: null,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating KYC data:', error);
      return NextResponse.json({ error: 'Failed to submit KYC data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in KYC submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
