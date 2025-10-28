import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export const protectedRoutes: string[] = [
  '/profile',
  '/orders',
  '/cart',
  '/vendor'
];

export const publicOnlyRoutes: string[] = [
  '/login',
  '/register'
];

export function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

export function isPublicOnlyRoute(pathname: string) {
  return publicOnlyRoutes.some((route) => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

export function isAuthenticatedFromRequest(req?: NextRequest): boolean {
  if (!req) return false;

  // NextAuth uses different cookie names based on environment
  const possibleCookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'token'
  ];

  return possibleCookieNames.some(name => 
    req.cookies.get(name)?.value !== undefined
  );
}

// For server components
export async function isAuthenticated() {
  const cookieStore = await cookies();
  const possibleCookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'token'
  ];

  return possibleCookieNames.some(name => 
    cookieStore.get(name)?.value !== undefined
  );
}

export async function requireUserSession() {
  try {
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('./auth');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      throw new Error('Unauthorized');
    }
    
    return session;
  } catch (error) {
    return null;
  }
}