import { NextRequest, NextResponse } from 'next/server';

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

    // Session exists, allow request (detailed validation happens in server components)
    return NextResponse.next();
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
