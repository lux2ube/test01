import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSession, refreshSession, destroySession } from '@/lib/auth/session';

// Server-side Supabase client using SSR package with proper cookie handling
export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
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
          } catch {
            // Called from Server Component - ignore
            // Middleware handles token refresh
          }
        },
      },
    }
  );
}

// Server-side Supabase client for API routes that need to set response cookies
export async function createClientForRoute(request: Request, response: { cookies: Map<string, { name: string; value: string; options: any }> }) {
  const cookieStore = await cookies();
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, { name, value, options });
          });
        },
      },
    }
  );
}

// Legacy session-based client (for compatibility with iron-session flows)
export async function createClientWithSession() {
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
      await destroySession();
      
      return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    const refreshedSession = await getSession();
    
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    await supabase.auth.setSession({
      access_token: refreshedSession.access_token,
      refresh_token: refreshedSession.refresh_token,
    });
    
    return supabase;
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
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
