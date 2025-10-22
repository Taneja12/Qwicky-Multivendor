'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function usePersistTokens() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session) {
      const access = (session as any).access || (session as any).user?.access || null;
      const refresh = (session as any).refresh || (session as any).user?.refresh || null;
      if (access) localStorage.setItem('token', access);
      if (refresh) localStorage.setItem('refreshToken', refresh);
    }
  }, [session]);
}
