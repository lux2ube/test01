import { headers } from 'next/headers';
import { createAdminClient } from './supabase/server';

/**
 * Verifies the Supabase auth token from the Authorization header
 * Returns the user if valid, throws error if invalid
 * NOTE: This only works with API routes, not Server Actions
 */
export async function verifyAuthToken() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const supabase = await createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verifies that the provided UID belongs to an admin user
 * This should be called from Server Actions with the UID from the client
 * @param uid The user ID to verify
 */
export async function verifyAdminByUid(uid: string) {
  if (!uid) {
    throw new Error('Unauthorized: No user ID provided');
  }
  
  try {
    const supabase = await createAdminClient();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', uid)
      .single();
    
    if (error || !user) {
      throw new Error('User not found');
    }
    
    if (user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    return { uid, admin: true };
  } catch (error) {
    console.error('Admin verification failed:', error);
    throw new Error('Unauthorized: Admin verification failed');
  }
}

/**
 * Verifies that the current user is an admin (for API routes with Authorization header)
 * Throws error if not authenticated or not an admin
 */
export async function verifyAdminToken() {
  const user = await verifyAuthToken();
  
  const supabase = await createAdminClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!userProfile || userProfile.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  
  return user;
}

/**
 * Gets the current authenticated user's UID (for API routes)
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await verifyAuthToken();
    return user.id;
  } catch {
    return null;
  }
}

/**
 * Verifies an ID token passed from the client (for Server Actions)
 * @param idToken The Supabase access token from the client
 * @returns The user object
 * @throws Error if token is invalid or expired
 */
export async function verifyClientIdToken(idToken: string) {
  if (!idToken) {
    throw new Error('No ID token provided');
  }
  
  try {
    const supabase = await createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(idToken);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    return user;
  } catch (error) {
    console.error('Client ID token verification failed:', error);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Checks if the current user owns the specified resource (for API routes)
 * @param resourceUserId The userId field from the resource
 */
export async function verifyResourceOwnership(resourceUserId: string) {
  const user = await verifyAuthToken();
  
  const supabase = await createAdminClient();
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (user.id !== resourceUserId && userProfile?.role !== 'admin') {
    throw new Error('Unauthorized: You do not have permission to access this resource');
  }
  
  return user;
}
