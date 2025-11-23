import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logLoginActivity } from '@/app/login/actions';

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
            } catch (error) {
              console.error('Error setting cookies:', error);
            }
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
    console.log('🍪 Cookies set in response');

    // Return success with redirect URL - cookies are now properly set
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
