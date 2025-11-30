import { createServerClient } from '@supabase/ssr';
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
    console.error('No code provided in OAuth callback');
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in server component
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error.message, error);
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (!data.session) {
      console.error('No session returned from code exchange');
      return NextResponse.redirect(`${origin}/login?error=no_session`);
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

      console.log('Creating new user profile for OAuth user:', user.id, userName);

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

    console.log('OAuth login successful for user:', user.id);

    const userRole = existingProfile?.role || 'user';
    const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : next;

    // Create response with session cookies set
    const finalResponse = NextResponse.redirect(`${origin}${redirectUrl}`);
    finalResponse.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    finalResponse.cookies.set('sb-refresh-token', session.refresh_token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
    
    return finalResponse;
  } catch (error: any) {
    console.error('Auth callback exception:', error?.message || error);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}
