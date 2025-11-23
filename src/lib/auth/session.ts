import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

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
