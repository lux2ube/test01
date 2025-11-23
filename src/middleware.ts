import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';

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
    const sessionCookie = request.cookies.get('auth_session');
    
    if (!sessionCookie) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      // Clear all auth cookies on redirect
      response.cookies.delete('auth_session');
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      response.cookies.delete('sb-session');
      return response;
    }

    try {
      const sessionData = await unsealData<SessionData>(sessionCookie.value, {
        password: process.env.SESSION_SECRET!,
      });

      if (!sessionData.userId || !sessionData.access_token) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_session');
        response.cookies.delete('sb-access-token');
        response.cookies.delete('sb-refresh-token');
        response.cookies.delete('sb-session');
        return response;
      }

      // Set Cache-Control on protected pages to prevent browser caching user data
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'private, no-store, must-revalidate');
      return response;
    } catch (error) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_session');
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      response.cookies.delete('sb-session');
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
