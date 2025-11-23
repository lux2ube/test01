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
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const sessionData = await unsealData<SessionData>(sessionCookie.value, {
        password: process.env.SESSION_SECRET!,
      });

      if (!sessionData.userId || !sessionData.access_token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
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
