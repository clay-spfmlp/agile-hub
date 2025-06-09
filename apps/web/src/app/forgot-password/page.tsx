'use client';

import { ForgotPasswordForm, useAuth } from '@repo/auth';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const { forgotPassword, error, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm
        onSubmit={async (data) => {
          await forgotPassword(data.email);
        }}
        error={error || undefined}
        loading={loading}
        onBack={() => router.push('/login')}
      />
    </div>
  );
} 