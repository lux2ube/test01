import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export interface SessionData {
  userId: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'auth_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(userId: string, access_token: string, refresh_token: string, expires_at: number) {
  const session = await getSession();
  session.userId = userId;
  session.access_token = access_token;
  session.refresh_token = refresh_token;
  session.expires_at = expires_at;
  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

export async function isSessionValid(): Promise<boolean> {
  const session = await getSession();
  if (!session.userId || !session.access_token) {
    return false;
  }
  
  // Check if session is expired
  if (session.expires_at && session.expires_at < Date.now() / 1000) {
    return false;
  }
  
  return true;
}

export async function refreshSession(): Promise<boolean> {
  const session = await getSession();
  
  if (!session.refresh_token) {
    return false;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });

    if (error || !data.session) {
      console.error('Token refresh failed:', error?.message);
      return false;
    }

    // Update session with new tokens
    session.access_token = data.session.access_token;
    session.refresh_token = data.session.refresh_token;
    session.expires_at = data.session.expires_at || 0;
    await session.save();

    console.log('✅ Session tokens refreshed successfully');
    return true;
  } catch (error) {
    console.error('Session refresh exception:', error);
    return false;
  }
}
