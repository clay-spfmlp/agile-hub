'use client';

import { RegisterForm, useAuth } from '@repo/auth';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const { register, error, loading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm
        onSubmit={async (data) => {
          await register(data.email, data.password, data.name);
        }}
        error={error || undefined}
        loading={loading}
        title="Join Fun Scrum"
        description="Create your account to get started"
        onLogin={() => router.push('/login')}
      />
    </div>
  );
} 