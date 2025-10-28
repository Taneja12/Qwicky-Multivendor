import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/navbar';
import SessionChecker from '@/components/SessionChecker';

export const metadata: Metadata = {
  title: 'Qwicky',
  description: 'Preorder food from campus canteens',
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className="bg-white dark:bg-gray-900">
      <body className="min-h-screen text-gray-900 dark:text-gray-100">
        <Providers>
        <SessionChecker />
          <Navbar />

          <div className="container mx-auto px-4 py-8">{children}</div>

          <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 py-8">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm">© {new Date().getFullYear()} Qwicky. All rights reserved.</div>
              <div className="flex items-center space-x-4 mt-3 md:mt-0">
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Twitter</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Instagram</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-300">Contact</a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
