import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logLoginActivity } from '@/actions/activity-actions';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
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

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Log login activity
    try {
      await logLoginActivity(data.user.id);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    // Fetch user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const redirectUrl = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

    console.log('✅ Login successful for user:', data.user.id, '→ redirecting to:', redirectUrl);

    // Return success with redirect URL - cookies are automatically set by Supabase
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
