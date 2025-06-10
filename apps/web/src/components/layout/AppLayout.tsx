'use client';

import React from 'react';
import { useAuth } from '@repo/auth';
import { usePathname } from 'next/navigation';
import { ScrumMasterNav } from '../navigation/ScrumMasterNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't render navigation while loading auth state
  if (loading) {
    return <>{children}</>;
  }

  // Pages that should not have the navigation (have their own styling/layout)
  const excludedPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/planning/join',
    '/', // Home page
  ];

  // Check if current path should exclude navigation
  const shouldExcludeNav = excludedPaths.some(path => pathname === path) || 
                          pathname.startsWith('/planning/') && pathname !== '/planning/setup';

  // Show scrum master navigation for SCRUM_MASTER and ADMIN roles
  const showScrumMasterNav = user && 
                            (user.role === 'SCRUM_MASTER' || user.role === 'ADMIN') && 
                            !shouldExcludeNav;

  // Apply background styling only when showing navigation
  if (showScrumMasterNav) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <ScrumMasterNav />
        <main>
          {children}
        </main>
      </div>
    );
  }

  // Return children without any wrapper for excluded pages
  return <>{children}</>;
} 