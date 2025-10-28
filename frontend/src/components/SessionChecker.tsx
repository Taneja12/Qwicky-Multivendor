'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function SessionChecker() {
  const { data: session } = useSession();

  useEffect(() => {
    // Only run if we have a session and there's an error
    if (session?.error === 'RefreshAccessTokenError') {
      console.log('Token refresh failed, logging out...');
      signOut({ 
        callbackUrl: '/login?message=Session expired. Please log in again.' 
      });
    }
  }, [session]);

  return null;
}