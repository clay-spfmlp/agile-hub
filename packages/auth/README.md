# @repo/auth

A shared authentication package for the Agile Hub monorepo that provides reusable auth components, context, and utilities for both the web and admin applications.

## Features

- 🔐 **Shared Auth Context** - Centralized authentication state management
- 🎨 **Pre-built Components** - Login, Register, Forgot Password forms
- 🛡️ **Protected Routes** - Role-based access control
- 📝 **Form Validation** - Zod schemas with react-hook-form integration
- 🎯 **TypeScript Support** - Full type safety
- 🎨 **UI Components** - Built with the shared UI package

## Installation

The package is automatically available in workspace apps. Add it to your app's dependencies:

```json
{
  "dependencies": {
    "@repo/auth": "workspace:*"
  }
}
```

## Quick Start

### 1. Setup Auth Provider

Wrap your app with the `AuthProvider` and provide configuration:

```tsx
// apps/web/src/app/layout.tsx
import { AuthProvider } from '@repo/auth';
import { authConfig } from '@/lib/auth-config';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider config={authConfig}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Create Auth Configuration

```tsx
// apps/web/src/lib/auth-config.ts
import { AuthConfig } from '@repo/auth';

export const authConfig: AuthConfig = {
  loginEndpoint: '/api/auth/login',
  registerEndpoint: '/api/auth/register',
  logoutEndpoint: '/api/auth/logout',
  meEndpoint: '/api/auth/me',
  forgotPasswordEndpoint: '/api/auth/forgot-password',
  resetPasswordEndpoint: '/api/auth/reset-password',
  redirectAfterLogin: '/dashboard',
  redirectAfterLogout: '/login',
};
```

### 3. Use Auth Components

```tsx
// Login Page
import { LoginForm, useAuth } from '@repo/auth';

export default function LoginPage() {
  const { login, error, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm
        onSubmit={async (data) => {
          await login(data.email, data.password);
        }}
        error={error || undefined}
        loading={loading}
      />
    </div>
  );
}
```

### 4. Protect Routes

```tsx
// Protected Admin Page
import { ProtectedRoute } from '@repo/auth';

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute 
      allowedRoles={['ADMIN', 'SCRUM_MASTER']}
      redirectTo="/login"
    >
      {children}
    </ProtectedRoute>
  );
}
```

## Components

### LoginForm

A complete login form with validation and error handling.

```tsx
<LoginForm
  onSubmit={async (data) => await login(data.email, data.password)}
  error={error}
  loading={loading}
  title="Welcome back"
  description="Sign in to your account"
  showForgotPassword={true}
  showRegister={true}
  onForgotPassword={() => router.push('/forgot-password')}
  onRegister={() => router.push('/register')}
/>
```

### RegisterForm

A registration form with password confirmation and validation.

```tsx
<RegisterForm
  onSubmit={async (data) => await register(data.email, data.password, data.name)}
  error={error}
  loading={loading}
  title="Create account"
  description="Get started today"
  showLogin={true}
  onLogin={() => router.push('/login')}
/>
```

### ForgotPasswordForm

A forgot password form with success state handling.

```tsx
<ForgotPasswordForm
  onSubmit={async (data) => await forgotPassword(data.email)}
  error={error}
  loading={loading}
  onBack={() => router.push('/login')}
  successMessage="Check your email for reset instructions"
/>
```

### ProtectedRoute

A wrapper component for protecting routes with role-based access.

```tsx
<ProtectedRoute
  allowedRoles={['ADMIN']}
  redirectTo="/login"
  fallback={<LoadingSpinner />}
>
  <AdminDashboard />
</ProtectedRoute>
```

## Hooks

### useAuth

Access authentication state and methods throughout your app.

```tsx
import { useAuth } from '@repo/auth';

function MyComponent() {
  const { 
    user, 
    loading, 
    error, 
    login, 
    register, 
    logout, 
    forgotPassword,
    resetPassword,
    checkAuth,
    clearError 
  } = useAuth();

  // Use auth state and methods
}
```

## Types

The package exports comprehensive TypeScript types:

```tsx
import type { 
  User, 
  AuthState, 
  AuthContextType, 
  AuthConfig,
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData 
} from '@repo/auth';
```

## Validation Schemas

Zod schemas are available for form validation:

```tsx
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '@repo/auth';
```

## Configuration

### AuthConfig

```tsx
interface AuthConfig {
  loginEndpoint: string;
  registerEndpoint: string;
  logoutEndpoint: string;
  meEndpoint: string;
  forgotPasswordEndpoint: string;
  resetPasswordEndpoint: string;
  redirectAfterLogin: string;
  redirectAfterLogout: string;
}
```

### User Roles

The package supports three user roles:
- `USER` - Regular users
- `SCRUM_MASTER` - Scrum masters with team management access
- `ADMIN` - Full administrative access

## API Integration

The auth package expects your API endpoints to follow these patterns:

### POST /api/auth/login
```json
// Request
{ "email": "user@example.com", "password": "password123" }

// Response
{ "user": { "id": "1", "email": "user@example.com", "name": "John Doe", "role": "USER" } }
```

### POST /api/auth/register
```json
// Request
{ "email": "user@example.com", "password": "password123", "name": "John Doe" }

// Response
{ "user": { "id": "1", "email": "user@example.com", "name": "John Doe", "role": "USER" } }
```

### GET /api/auth/me
```json
// Response
{ "user": { "id": "1", "email": "user@example.com", "name": "John Doe", "role": "USER" } }
```

### POST /api/auth/logout
```json
// Response
{ "success": true }
```

## Examples

See the `apps/web` and `apps/admin` directories for complete implementation examples. 