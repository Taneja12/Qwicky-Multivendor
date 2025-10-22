import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

/**
 * Define which routes require authentication
 */
export const protectedRoutes: string[] = [];

/**
 * Define which routes should only be accessible when NOT authenticated
 */
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

// Async helper for server components that need the full NextAuth session.
export async function requireUserSession() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (e) {
    console.error('Error getting session:', e);
    return null;
  }
}