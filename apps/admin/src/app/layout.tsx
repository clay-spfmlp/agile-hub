'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider, useAuth } from '@repo/auth';
import { authConfig } from '@/lib/auth-config';
import Navigation from '@/components/Navigation';
import { usePathname } from 'next/navigation';
import { Toaster } from '@repo/ui/components/base/sonner';

const inter = Inter({ subsets: ['latin'] });

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Show navigation only when user is logged in and not on home page
  const showNavigation = user && pathname !== '/';

  if (!showNavigation) {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider config={authConfig}>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
} 
