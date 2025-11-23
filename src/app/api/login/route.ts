import { createAdminClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth/session';
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

    // Create our own session cookie with Supabase tokens
    await createSession(
      data.user.id,
      data.session.access_token,
      data.session.refresh_token,
      data.session.expires_at || 0
    );

    // Fetch user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const redirectUrl = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    console.log('✅ Login successful, session created for user:', data.user.id);

    return NextResponse.json({
      success: true,
      redirectUrl,
      userId: data.user.id,
    });
  } catch (error) {
    console.error('❌ Login exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
