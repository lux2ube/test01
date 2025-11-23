import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

/**
 * SECURE server-side endpoint to sync Supabase client session
 * CRITICAL: Validates iron-session user ID matches Supabase tokens before committing
 * This prevents token swap attacks where client blindly adopts malicious tokens
 */
export async function POST() {
  try {
    // Step 1: Validate iron-session (server-side session)
    const session = await getSession();
    
    if (!session.userId || !session.access_token || !session.refresh_token) {
      console.error('❌ No valid iron-session found');
      return NextResponse.json({ error: 'No valid session found' }, { status: 401 });
    }

    // Step 2: Create Supabase client with SSR cookies
    const supabase = await createClient();

    // Step 3: Set session with tokens from iron-session (NOT from client request)
    const { data, error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    if (error) {
      console.error('❌ Failed to set Supabase session:', error);
      return NextResponse.json({ error: 'Failed to set session' }, { status: 500 });
    }

    // Step 4: CRITICAL VALIDATION - Ensure Supabase session matches iron-session
    if (data.session?.user?.id !== session.userId) {
      console.error('🚨 SESSION INTEGRITY VIOLATION DETECTED!', {
        ironSessionUserId: session.userId,
        supabaseUserId: data.session?.user?.id,
      });
      return NextResponse.json({ error: 'Session integrity violation' }, { status: 403 });
    }

    console.log('✅ Supabase session synced securely for user:', session.userId);

    // Return validated tokens so client can update its Supabase session cache
    // SECURITY: These tokens have been validated against iron-session user ID
    return NextResponse.json({ 
      success: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (error) {
    console.error('❌ Error setting session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
