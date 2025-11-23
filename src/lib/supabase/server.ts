import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSession, refreshSession, destroySession } from '@/lib/auth/session';

// Server-side Supabase client that uses session tokens
export async function createClient() {
  const session = await getSession();
  
  if (!session.access_token || !session.userId) {
    // Return unauthenticated client
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now() / 1000;
  const expiryBuffer = 5 * 60; // 5 minutes
  
  if (session.expires_at && session.expires_at < now + expiryBuffer) {
    console.log('⏱️ Access token expired or expiring soon, refreshing...');
    const refreshed = await refreshSession();
    
    if (!refreshed) {
      console.error('❌ Failed to refresh session, destroying session cookie');
      // Destroy session on refresh failure to force re-authentication
      await destroySession();
      
      // Return unauthenticated client
      return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    // Re-fetch session after refresh
    const refreshedSession = await getSession();
    
    // Create authenticated client and set session
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Set session so auth helpers work correctly
    await supabase.auth.setSession({
      access_token: refreshedSession.access_token,
      refresh_token: refreshedSession.refresh_token,
    });
    
    return supabase;
  }

  // Create authenticated client with current session tokens
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  // Set session so auth helpers work correctly
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  
  return supabase;
}

// Admin client for server-side operations (doesn't require user session)
export async function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
