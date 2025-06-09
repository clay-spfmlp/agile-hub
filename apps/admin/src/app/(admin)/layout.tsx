'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@repo/auth';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute 
      allowedRoles={['ADMIN', 'SCRUM_MASTER']}
      redirectTo="/"
    >
      <div className="min-h-screen bg-gray-100">
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
} 