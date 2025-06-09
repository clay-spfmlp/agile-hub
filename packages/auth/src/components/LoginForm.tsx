'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormData } from '../lib/validations';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  error?: string;
  loading?: boolean;
  title?: string;
  description?: string;
  showForgotPassword?: boolean;
  onForgotPassword?: () => void;
  showRegister?: boolean;
  onRegister?: () => void;
}

export function LoginForm({
  onSubmit,
  error,
  loading = false,
  title = 'Welcome back',
  description = 'Enter your credentials to access your account',
  showForgotPassword = true,
  onForgotPassword,
  showRegister = true,
  onRegister,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const isLoading = loading || isSubmitting;

  return (
    <div className="w-full">
      {(title || description) && (
        <div className="text-center mb-6">
          {title && <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            disabled={isLoading}
            className="h-12 px-4 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-opacity-20 transition-all duration-200 bg-white placeholder:text-gray-400"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              disabled={isLoading}
              className="h-12 px-4 pr-12 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 focus:ring-2 focus:ring-opacity-20 transition-all duration-200 bg-white placeholder:text-gray-400"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-md transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        {showForgotPassword && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-indigo-600 hover:text-indigo-500 font-medium"
              onClick={onForgotPassword}
              disabled={isLoading}
            >
              Forgot password?
            </Button>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg" 
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>

        {showRegister && (
          <div className="text-center text-sm">
            <span className="text-gray-600">Don&apos;t have an account? </span>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="px-0 text-indigo-600 hover:text-indigo-500 font-medium"
              onClick={onRegister}
              disabled={isLoading}
            >
              Create one
            </Button>
          </div>
        )}
      </form>
    </div>
  );
} 