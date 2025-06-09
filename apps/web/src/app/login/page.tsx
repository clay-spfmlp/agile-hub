'use client';

import { LoginForm, useAuth } from '@repo/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@repo/ui/components/base/button';

export default function LoginPage() {
  const { login, error, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">Fun Scrum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-16">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-gray-600">
              Ready to make sprint planning fun again?
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white/70 backdrop-blur rounded-2xl shadow-xl border-0 p-8">
            <LoginForm
              onSubmit={async (data) => {
                await login(data.email, data.password);
              }}
              error={error || undefined}
              loading={loading}
              title=""
              description=""
              onForgotPassword={() => router.push('/forgot-password')}
              onRegister={() => router.push('/register')}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4">
              Don't have an account yet?
            </p>
            <Button 
              variant="outline" 
              className="bg-white/50 backdrop-blur border-indigo-200 hover:bg-white/80"
              onClick={() => router.push('/register')}
            >
              Create your free account
            </Button>
          </div>

          {/* Features Preview */}
          <div className="mt-12 bg-white/50 backdrop-blur rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              What awaits you:
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span>Real-time collaborative planning sessions</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Instant voting with your team</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Smart estimation tools & analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 