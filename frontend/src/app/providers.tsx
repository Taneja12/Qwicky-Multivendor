'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams?.get('authMessage');
    const type = searchParams?.get('authType') || 'info';

    if (message) {
      // Map types to toast functions
      if (type === 'success') toast.success(message);
      else if (type === 'error') toast.error(message);
      else toast(message);

      // Remove params to prevent duplicate toasts and avoid layout flicker
      const url = new URL(window.location.href);
      url.searchParams.delete('authMessage');
      url.searchParams.delete('authType');
      // Replace without scrolling
      router.replace(url.pathname + url.search, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#0b0b0b', color: '#fff' } }} />
      </QueryClientProvider>
    </SessionProvider>
  );
}