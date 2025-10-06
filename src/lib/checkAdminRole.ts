'use client';

import { createClient } from '@/lib/supabase/client';

/**
 * Checks if the currently signed-in user has an 'admin' role.
 * This checks the user's role in the users table.
 *
 * @returns A promise that resolves to true if the user is an admin, otherwise false.
 */
export async function checkAdminRole(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return false;
  }

  try {
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error || !userProfile) {
      return false;
    }
    
    return userProfile.role === 'admin';
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
}
