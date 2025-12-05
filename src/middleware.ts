import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { unsealData } from 'iron-session';

interface SessionData {
  userId: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Create a response that we can modify
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create Supabase client with proper cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Create new response with updated request
          supabaseResponse = NextResponse.next({
            request,
          });
          // Set cookies on the response
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: Refresh session - this keeps the user logged in
  // getUser() validates the token and refreshes if needed
  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ['/dashboard', '/admin', '/phone-verification'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    // First check Supabase session (primary auth)
    if (user) {
      // User is authenticated via Supabase, allow access
      supabaseResponse.headers.set('Cache-Control', 'private, no-store, must-revalidate');
      return supabaseResponse;
    }

    // Fallback: Check iron-session (backup auth for compatibility)
    const sessionCookie = request.cookies.get('auth_session');
    
    if (sessionCookie) {
      try {
        const sessionData = await unsealData<SessionData>(sessionCookie.value, {
          password: process.env.SESSION_SECRET!,
        });

        if (sessionData.userId && sessionData.access_token) {
          // Iron-session is valid, allow access
          supabaseResponse.headers.set('Cache-Control', 'private, no-store, must-revalidate');
          return supabaseResponse;
        }
      } catch (error) {
        // Iron-session is invalid, continue to redirect
        console.error('Iron-session validation failed:', error);
      }
    }

    // No valid session found, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Clear all auth cookies
    response.cookies.delete('auth_session');
    return response;
  }
  
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes that shouldn't have middleware
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
