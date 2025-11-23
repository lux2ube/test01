import { createAdminClient } from '@/lib/supabase/server';
import { createSessionCookie } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use admin client to authenticate (bypasses browser cookie issues)
    const supabase = await createAdminClient();
    
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

    // Create sealed session cookie
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

    // Set iron-session cookie for server-side auth
    response.cookies.set('auth_session', sealedSession, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Disabled for Replit development
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Also set Supabase auth session so client-side checks work
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ Login exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
