import 'server-only';
import { createClient } from '@/lib/supabase/server';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  emailVerified: boolean;
  role?: 'user' | 'admin';
}

/**
 * Get authenticated user from Supabase session in server actions
 * Throws an error if no valid session exists
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: No valid session found');
  }

  try {
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || null,
      emailVerified: user.email_confirmed_at != null,
      role: userProfile?.role || 'user',
    };
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw new Error('Unauthorized: Invalid session');
  }
}

/**
 * Get authenticated user or return null if no valid session
 * Use this when authentication is optional
 */
export async function getAuthenticatedUserOrNull(): Promise<AuthenticatedUser | null> {
  try {
    return await getAuthenticatedUser();
  } catch {
    return null;
  }
}
