import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session.userId || !session.access_token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const supabaseClient = await createClient();
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();

    const supabase = await createAdminClient();
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (error || !profile) {
      console.error('Failed to fetch user profile:', error);
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: session.userId,
        email: profile.email,
        emailConfirmedAt: authUser?.email_confirmed_at || null,
        profile: {
          id: session.userId,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          clientId: profile.client_id,
          createdAt: profile.created_at,
          country: profile.country,
          isVerified: profile.is_verified,
          status: profile.status,
          phoneNumber: profile.phone_number,
          phoneNumberVerified: profile.phone_number_verified,
          referralCode: profile.referral_code,
          referredBy: profile.referred_by,
          level: profile.level,
          monthlyEarnings: profile.monthly_earnings,
          kycData: (profile.kyc_status || profile.kyc_document_front_url) ? {
            documentType: profile.kyc_document_type,
            documentNumber: profile.kyc_document_number || '',
            fullName: profile.kyc_full_name || '',
            dateOfBirth: profile.kyc_date_of_birth,
            nationality: profile.kyc_nationality || '',
            documentIssueDate: profile.kyc_document_issue_date,
            documentExpiryDate: profile.kyc_document_expiry_date,
            gender: profile.kyc_gender || 'male',
            documentFrontUrl: profile.kyc_document_front_url || '',
            documentBackUrl: profile.kyc_document_back_url,
            status: profile.kyc_status || 'Pending',
            submittedAt: profile.kyc_submitted_at,
            rejectionReason: profile.kyc_rejection_reason,
          } : undefined,
          addressData: profile.address_status ? {
            country: profile.address_country || '',
            status: profile.address_status || 'Pending',
            submittedAt: profile.address_submitted_at,
            rejectionReason: profile.address_rejection_reason,
          } : undefined,
        },
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
