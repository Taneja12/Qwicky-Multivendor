'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
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
    const password2 = formData.get('password2') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    try {
      await authApi.register({
        email,
        password,
        password2,
        first_name: firstName,
        last_name: lastName,
      });

      toast.success('Account created successfully! Please sign in.');
      router.push('/login?registered=true');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } } | undefined;
      const errorMessage = err?.response?.data?.detail || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while checking session or redirecting
  if (status === "loading" || (status === "authenticated" && session)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex items-center space-x-4 text-white">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Redirecting...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <section className="w-full max-w-md">
        <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-md border border-white/6 rounded-2xl p-8 shadow-xl">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-semibold text-white">Create account</h1>
            <p className="mt-2 text-sm text-gray-400">Join us — create your account to place orders</p>
            <p className="mt-2 text-sm">
              <Link href="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Sign in instead</Link>
            </p>
          </header>

          <form className="space-y-5" onSubmit={onSubmit} aria-label="Create account form">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">First name</label>
                <input id="firstName" name="firstName" type="text" autoComplete="given-name" className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="First name" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">Last name</label>
                <input id="lastName" name="lastName" type="text" autoComplete="family-name" className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Last name" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Password" aria-label="Password" />
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-300 mb-1">Confirm password</label>
              <input id="password2" name="password2" type="password" autoComplete="new-password" required className="w-full rounded-2xl px-4 py-2 bg-transparent border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Confirm password" aria-label="Confirm password" />
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 rounded-2xl text-white font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-105 transform transition-all shadow-lg hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/30" aria-label="Create account">{isLoading ? 'Creating account...' : 'Create account'}</button>
            </div>
          </form>
        </div>

        <footer className="mt-6 text-center text-sm text-gray-500">
          <p>Already have an account? <Link href="/login" className="text-indigo-400 hover:underline">Sign in</Link></p>
        </footer>
      </section>
    </main>
  );
}