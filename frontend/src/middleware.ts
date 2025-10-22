import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const isAuthPage = ['/login', '/register'].includes(req.nextUrl.pathname);
    
    if (isAuthPage) {
      // Redirect authenticated users away from auth pages
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isAuthPage = ['/login', '/register'].includes(req.nextUrl.pathname);
        // Allow unauthenticated access to auth pages, require auth for everything else
        return isAuthPage ? !token : !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/cart/:path*',
    '/vendor/:path*',
  ],
};