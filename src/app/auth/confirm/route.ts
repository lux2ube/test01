import { createServerClient } from '@supabase/ssr';
import { createSessionCookie } from '@/lib/auth/session';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function isValidRedirectUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith('/') && !url.startsWith('//') && !url.includes(':');
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const rawNext = requestUrl.searchParams.get('next');
  const next: string = (rawNext && isValidRedirectUrl(rawNext)) ? rawNext : '/dashboard';
  
  let origin = requestUrl.origin;
  const headers = request.headers;
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || 'https';
  
  if (host && !origin.includes(host)) {
    origin = `${proto}://${host}`;
  }

  if (!token_hash || !type) {
    console.error('Missing token_hash or type in email confirmation');
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
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
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'signup' | 'recovery' | 'email_change',
    });

    if (error) {
      console.error('Token verification error:', error.message);
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password?error=invalid_link&message=${encodeURIComponent(error.message)}`);
      }
      return NextResponse.redirect(`${origin}/verify-email?error=verification_failed&message=${encodeURIComponent(error.message)}`);
    }

    if (!data.session) {
      console.log('Email confirmed but no session - user needs to log in');
      return NextResponse.redirect(`${origin}/login?message=email_confirmed`);
    }

    const { session, user } = data;

    console.log('✅ Token verification successful for user:', user?.id, 'type:', type);

    const allowInsecure = process.env.DEV_ALLOW_INSECURE_COOKIES === 'true';
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'strict' as const,
      secure: !allowInsecure,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };
    
    const sealedSession = await createSessionCookie(
      user!.id,
      session.access_token,
      session.refresh_token,
      session.expires_at || 0
    );
    
    let redirectUrl: string;
    
    if (type === 'recovery') {
      redirectUrl = `${origin}/reset-password?verified=true`;
    } else if (type === 'signup' || type === 'email') {
      redirectUrl = `${origin}/verify-email?success=true&next=${encodeURIComponent(next)}`;
    } else {
      redirectUrl = `${origin}${next}`;
    }
    
    const finalResponse = NextResponse.redirect(redirectUrl);
    
    finalResponse.cookies.set('auth_session', sealedSession, cookieOptions);
    finalResponse.cookies.set('sb-access-token', session.access_token, cookieOptions);
    finalResponse.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions);
    
    return finalResponse;
  } catch (error: any) {
    console.error('Email confirmation exception:', error?.message || error);
    return NextResponse.redirect(`${origin}/verify-email?error=confirmation_failed`);
  }
}
