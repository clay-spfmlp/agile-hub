'use client';

import { useAuth } from '@repo/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Role-based redirect logic
      switch (user.role) {
        case 'SCRUM_MASTER':
          router.push('/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'USER':
        default:
          router.push('/planning');
          break;
      }
    }
  }, [user, loading, router]);

  return null; // This component doesn't render anything
} 