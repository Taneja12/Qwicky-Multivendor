import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // No additional logic - let the callbacks handle everything
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // List of protected routes that require authentication
        const protectedRoutes = [
          '/profile',
          '/orders', 
          '/cart',
          '/vendor'
        ];
        
        // Check if current path is a protected route
        const isProtectedRoute = protectedRoutes.some(route => 
          pathname === route || pathname.startsWith(route + '/')
        );
        
        // If it's a protected route, require authentication
        if (isProtectedRoute) {
          return !!token;
        }
        
        // All other routes (including /login, /register) are public
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/profile/:path*',
    '/orders/:path*', 
    '/cart/:path*',
    '/vendor/:path*',
  ],
};