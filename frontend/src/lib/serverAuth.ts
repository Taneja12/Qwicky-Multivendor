import { NextRequest } from 'next/server';

/**
 * Small contract:
 * - isAuthenticatedFromRequest(req?): boolean
 * - isProtectedRoute(path): boolean
 *
 * This helper reads the session token cookie securely on the server.
 * It intentionally does not return any sensitive user data.
 */

export const protectedRoutes: string[] = [];
export const publicOnlyRoutes: string[] = [];

export function isProtectedRoute(pathname: string) {
  return protectedRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));
}

export function isPublicOnlyRoute(pathname: string) {
  return publicOnlyRoutes.includes(pathname);
}

/**
 * Synchronous check used in middleware. If NextRequest is available it will
 * read cookies from it. For server components call the cookies() helper
 * directly where async/await is allowed.
 */
export function isAuthenticatedFromRequest(req?: NextRequest): boolean {
  if (!req) return false;

  const token = req.cookies.get('next-auth.session-token')?.value || req.cookies.get('token')?.value;
  return Boolean(token);
}

// Named exports are already declared above.

// Async helper for server components that need the full NextAuth session.
export async function requireUserSession() {
  try {
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('./auth');
    const session = await getServerSession(authOptions as any);
    return session;
  } catch (e) {
    return null;
  }
}
