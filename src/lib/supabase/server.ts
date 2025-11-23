import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/auth/session';

// Server-side Supabase client that uses session tokens
export async function createClient() {
  const session = await getSession();
  
  if (!session.access_token) {
    // Return unauthenticated client
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // Return authenticated client with session tokens
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    }
  );
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
