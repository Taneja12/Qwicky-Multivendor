import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthenticatedFromRequest, isProtectedRoute, isPublicOnlyRoute } from './src/lib/serverAuth';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute(pathname) && !isAuthenticatedFromRequest(request)) {
    const url = new URL('/login', request.url);
    url.searchParams.set('authMessage', 'Please log in to continue.');
    url.searchParams.set('authType', 'info');
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from public-only pages (login/register)
  if (isPublicOnlyRoute(pathname) && isAuthenticatedFromRequest(request)) {
    const url = new URL('/', request.url);
    url.searchParams.set('authMessage', "You're already logged in.");
    url.searchParams.set('authType', 'info');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};