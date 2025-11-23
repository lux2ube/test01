import { NextRequest, NextResponse } from 'next/server';
import { sealData, unsealData } from 'iron-session';

interface SessionData {
  userId: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const protectedPaths = ['/dashboard', '/admin', '/phone-verification'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    // Check for our custom session cookie
    const sessionCookie = request.cookies.get('auth_session');
    
    if (!sessionCookie) {
      const redirectUrl = new URL('/login', request.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Validate session expiry (basic check)
    try {
      const sessionData = await unsealData<SessionData>(sessionCookie.value, {
        password: process.env.SESSION_SECRET!,
      });

      // Check for missing required session fields
      if (!sessionData.userId || !sessionData.access_token || !sessionData.refresh_token) {
        console.log('🚫 Invalid session data (missing required fields), redirecting to login');
        const redirectUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('auth_session');
        return response;
      }

      // If session is expired beyond refresh window, redirect to login
      const now = Date.now() / 1000;
      const maxExpiry = 60 * 60 * 24 * 7; // 7 days (max session age)
      
      if (sessionData.expires_at && sessionData.expires_at + maxExpiry < now) {
        console.log('🚫 Session expired beyond refresh window, redirecting to login');
        const redirectUrl = new URL('/login', request.url);
        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete('auth_session');
        return response;
      }

      // Session exists and is potentially valid, allow request
      // (Token refresh happens in createClient() if needed)
      return NextResponse.next();
    } catch (error) {
      // Invalid session cookie, redirect to login
      console.error('Invalid session cookie:', error);
      const redirectUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.delete('auth_session');
      return response;
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
