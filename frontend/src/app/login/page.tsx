'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

function LoginContent() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Debug session state
  useEffect(() => {
    console.log('🔐 Session Status:', status);
    console.log('🔐 Session Data:', session);
    console.log('🔐 Search Params:', Object.fromEntries(searchParams.entries()));
  }, [session, status, searchParams]);

  // Handle redirect when authenticated - MOVED TO useEffect
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log('🔄 Already authenticated, redirecting...');
      router.push('/');
    }
  }, [status, session, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('🚀 Attempting login with:', { email });

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('📨 SignIn result:', result);

      if (result?.error) {
        console.error('❌ SignIn error:', result.error);
        let errorMessage = result.error;
        
        if (result.error.includes('CredentialsSignin')) {
          errorMessage = 'Invalid email or password';
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (result?.ok) {
        console.log('✅ Login successful, waiting for session update...');
        
        // Wait a bit for the session to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force session update
        const updated = await update();
        console.log('🔄 Session update result:', updated);
        
        // Get fresh session
        const freshSession = await getSession();
        console.log('🆕 Fresh session:', freshSession);
        
        if (freshSession) {
          toast.success('Welcome back!', { 
            icon: '👋',
            duration: 4000
          });
          
          // Redirect to home page
          router.push('/');
          router.refresh();
        } else {
          throw new Error('Session not created after login');
        }
        
      } else {
        const errorMessage = 'Sign in failed - no error but not ok';
        console.error('❌', errorMessage, result);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error: unknown) {
      console.error('💥 Login error', error);
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center space-x-4 text-white">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Checking authentication...</span>
        </div>
      </main>
    );
  }

  // Don't render if authenticated (will be handled by useEffect)
  if (status === "authenticated" && session) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <section className="w-full max-w-md">
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-white/6 rounded-2xl p-8 shadow-xl">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-white">Sign in</h1>
            <p className="mt-2 text-sm text-gray-400">Welcome back — please sign in to continue</p>
            <p className="mt-2 text-sm">
              <Link href="/register" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Create a new account</Link>
            </p>
          </header>

          <form className="space-y-5" onSubmit={onSubmit} aria-label="Sign in form">
            {error && (
              <div role="alert" className="bg-red-600/10 border border-red-500/20 text-red-300 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow shadow-sm"
                placeholder="you@example.com"
                aria-label="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-shadow shadow-sm"
                placeholder="Your password"
                aria-label="Password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 rounded-2xl text-white font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transform transition-all shadow-lg hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Sign in"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        <footer className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in you agree to our <Link href="#" className="text-indigo-400 hover:underline">terms</Link>.</p>
        </footer>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center space-x-4 text-white">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </div>
      </main>
    }>
      <LoginContent />
    </Suspense>
  );
}