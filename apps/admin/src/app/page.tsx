'use client';

import { useAuth } from '@repo/auth';
import { Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is logged in, redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        // If user is not logged in, redirect to login page
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  // Show loading screen while determining redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AgileHub Admin</h1>
        <p className="text-gray-600">
          {loading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
} 