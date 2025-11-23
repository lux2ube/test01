'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { logLoginActivity } from './actions';

export async function loginWithEmail(email: string, password: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: 'Invalid email or password' };
    }

    if (!data.user) {
      return { error: 'Authentication failed' };
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

    console.log('✅ Server Action Login successful for user:', data.user.id);
    
    // Server Actions automatically handle cookies and redirect
    redirect(redirectUrl);
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('❌ Login exception:', error);
    return { error: 'Internal server error' };
  }
}
