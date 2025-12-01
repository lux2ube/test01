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
  
  // Fix for Replit: 0.0.0.0 is internal server address, not valid for browser redirects
  // Use the Host header or X-Forwarded-Host if available, otherwise fallback to requestUrl
  let origin = requestUrl.origin;
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || 'https';
  
  console.log('🔍 OAuth Callback Origin Detection:', {
    originalOrigin: requestUrl.origin,
    host,
    proto,
  });
  
  if (host && !origin.includes(host)) {
    origin = `${proto}://${host}`;
    console.log('✅ Updated origin to:', origin);
  } else {
    console.log('⚠️ Using original origin:', origin);
  }

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

    console.log('✅ OAuth login successful for user:', user.id);

    const userRole = existingProfile?.role || 'user';
    const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : next;
    const fullRedirectUrl = `${origin}${redirectUrl}`;
    
    console.log('🔄 Redirecting to:', {
      origin,
      redirectPath: redirectUrl,
      fullUrl: fullRedirectUrl,
      userRole,
    });

    // Create response with session cookies set
    const finalResponse = NextResponse.redirect(fullRedirectUrl);
    
    // Always use secure in production, but allow insecure in development for Replit
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: isProduction, // Only true in production
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };
    
    console.log('🍪 Setting session cookies with secure:', isProduction);
    finalResponse.cookies.set('sb-access-token', session.access_token, cookieOptions);
    finalResponse.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions);
    
    return finalResponse;
  } catch (error: any) {
    console.error('Auth callback exception:', error?.message || error);
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }
}
