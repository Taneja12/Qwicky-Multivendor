"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePersistTokens } from '@/hooks/usePersistTokens';
import { Menu, ShoppingCart, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

type UserWithRole = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const NavLink = ({ href, children, className, onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative px-3 py-2 transition-colors duration-200',
        'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100',
        isActive && 'text-gray-900 dark:text-gray-100',
        className
      )}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-sky-600" />
      )}
    </Link>
  );
};

export function Navbar() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  usePersistTokens();

  const userRole = (session?.user as UserWithRole | undefined)?.role ?? null;

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and desktop navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100 hover:opacity-90 transition-opacity">
              Qwicky
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <NavLink href="/vendors">Vendors</NavLink>
              <NavLink href="/orders">Orders</NavLink>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/cart" 
              className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>

            {session ? (
              <div className="hidden md:block relative group">
                <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>

                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Profile
                    </Link>
                    {userRole === 'VENDOR' && (
                      <Link
                        href="/vendor/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Vendor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile menu */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] dark:bg-gray-900">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="flex flex-col space-y-4 mt-6">
                    <NavLink href="/" onClick={handleLinkClick}>
                      Home
                    </NavLink>
                    <NavLink href="/vendors" onClick={handleLinkClick}>
                      Vendors
                    </NavLink>
                    <NavLink href="/orders" onClick={handleLinkClick}>
                      Orders
                    </NavLink>

                    {session ? (
                      <>
                        {/* Mobile user menu */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                            Signed in as {session.user?.email}
                          </div>
                          <Link
                            href="/profile"
                            onClick={handleLinkClick}
                            className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md"
                          >
                            Profile
                          </Link>
                          {userRole === 'VENDOR' && (
                            <Link
                              href="/vendor/dashboard"
                              onClick={handleLinkClick}
                              className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md"
                            >
                              Vendor Dashboard
                            </Link>
                          )}
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md"
                          >
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                        <Link
                          href="/login"
                          onClick={handleLinkClick}
                          className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md text-center"
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          onClick={handleLinkClick}
                          className="block bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 rounded-md text-center transition-colors"
                        >
                          Register
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}