import { createServerClient } from '@supabase/ssr';
import { createSessionCookie } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Track cookies that need to be set on the response
    const cookiesToSet: { name: string; value: string; options: any }[] = [];

    // Create Supabase client with SSR cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie);
            });
          },
        },
      }
    );
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error.message);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create sealed iron-session cookie for server-side auth
    const sealedSession = await createSessionCookie(
      data.user.id,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at || 0
    );

    // Fetch user role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    console.log('User profile role:', profile?.role, 'Profile:', profile);
    const redirectUrl = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    console.log('Redirect URL:', redirectUrl);

    console.log('✅ Login successful, session created for user:', data.user.id);

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      userId: data.user.id,
    });

    // CRITICAL: Set all Supabase SSR cookies (these are the ones the browser client reads)
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });

    // SECURITY: Secure cookies by default (financial-grade requirement)
    const allowInsecure = process.env.DEV_ALLOW_INSECURE_COOKIES === 'true';
    
    const ironSessionCookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const, // Use 'lax' for cross-origin redirect compatibility
      secure: !allowInsecure,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    // Set iron-session cookie for server-side auth (backup/validation)
    response.cookies.set('auth_session', sealedSession, ironSessionCookieOptions);

    return response;
  } catch (error) {
    console.error('❌ Login exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
