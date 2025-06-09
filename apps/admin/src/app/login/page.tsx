'use client';

import { LoginForm, useAuth } from '@repo/auth';
import { Shield, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, error, loading, user } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  // Don't render anything while checking auth or if user is logged in
  if (loading || user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AgileHub Admin</h1>
          </div>
          <p className="text-lg text-gray-600">
            Sign in to access your admin dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/70 backdrop-blur rounded-2xl shadow-xl border-0 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Enter your credentials to continue
            </p>
          </div>

          <div className="admin-login-form">
            <style jsx>{`
              .admin-login-form :global(button[type="submit"]) {
                background: linear-gradient(135deg, #475569 0%, #4f46e5 100%);
                color: white;
                font-weight: 600;
                border: none;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
              }
              .admin-login-form :global(button[type="submit"]:hover) {
                background: linear-gradient(135deg, #334155 0%, #4338ca 100%);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
                transform: translateY(-1px);
              }
              .admin-login-form :global(button[type="submit"]:disabled) {
                opacity: 0.7;
                transform: none;
              }
            `}</style>
            <LoginForm
              onSubmit={async (data) => {
                await login(data.email, data.password);
              }}
              error={error || undefined}
              loading={loading}
              title=""
              description=""
              showRegister={false}
              showForgotPassword={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 AgileHub Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
} 