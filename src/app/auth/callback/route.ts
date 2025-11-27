import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth/session';
import { generateReferralCode } from '@/lib/referral';
import { getCountryFromHeaders } from '@/lib/server-geo';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    const { session, user } = data;

    const supabaseAdmin = await createAdminClient();
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking user profile:', profileError);
    }

    if (!existingProfile) {
      const detectedCountry = await getCountryFromHeaders();
      const userName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'User';

      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          name: userName,
          email: user.email,
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          referral_code: generateReferralCode(userName),
          level: 1,
          monthly_earnings: 0,
          country: detectedCountry,
        });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }
    }

    const ironSession = await getSession();
    ironSession.userId = user.id;
    ironSession.access_token = session.access_token;
    ironSession.refresh_token = session.refresh_token;
    ironSession.expires_at = session.expires_at || 0;
    await ironSession.save();

    const userRole = existingProfile?.role || 'user';
    const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : next;

    return NextResponse.redirect(`${origin}${redirectUrl}`);
  } catch (error) {
    console.error('Auth callback exception:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}
