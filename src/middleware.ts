import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from './lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const protectedPaths = ['/dashboard', '/admin', '/phone-verification'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    try {
      // Read our custom session cookie
      const session = await getIronSession<SessionData>(request.cookies, {
        password: process.env.SESSION_SECRET!,
        cookieName: 'auth_session',
      });

      // Check if session exists and is valid
      if (!session.userId || !session.access_token) {
        const redirectUrl = new URL('/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Check if session is expired
      if (session.expires_at && session.expires_at < Date.now() / 1000) {
        const redirectUrl = new URL('/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Session is valid, allow request
      return NextResponse.next();
    } catch (error) {
      console.error('Middleware session error:', error);
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/phone-verification',
  ],
};
