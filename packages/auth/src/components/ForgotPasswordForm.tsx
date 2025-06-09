'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Alert, AlertDescription } from '@repo/ui/components/base/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../lib/validations';

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  error?: string;
  loading?: boolean;
  title?: string;
  description?: string;
  onBack?: () => void;
  successMessage?: string;
}

export function ForgotPasswordForm({
  onSubmit,
  error,
  loading = false,
  title = 'Reset your password',
  description = 'Enter your email address and we\'ll send you a link to reset your password',
  onBack,
  successMessage,
}: ForgotPasswordFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const isLoading = loading || isSubmitting;

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await onSubmit(data);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by parent component
    }
  };

  if (isSubmitted && !error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            {successMessage || 'We\'ve sent a password reset link to your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {onBack && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>

          {onBack && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
} 