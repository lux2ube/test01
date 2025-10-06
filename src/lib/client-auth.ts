'use client';

import { createClient } from './supabase/client';

/**
 * Gets the current user's Supabase access token
 * This token should be passed to server actions for authentication
 * @throws Error if user is not authenticated
 */
export async function getCurrentUserIdToken(): Promise<string> {
  const supabase = createClient();
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('User not authenticated');
  }
  
  return session.access_token;
}

/**
 * Gets the current user's ID token, or null if not authenticated
 * Use this when you want to handle unauthenticated state gracefully
 */
export async function getCurrentUserIdTokenSafe(): Promise<string | null> {
  try {
    return await getCurrentUserIdToken();
  } catch {
    return null;
  }
}
