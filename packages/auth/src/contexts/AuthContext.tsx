'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthContextType, User, AuthConfig } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  config: AuthConfig;
}

export function AuthProvider({ children, config }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load token from localStorage on component mount
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
    }
    checkAuth();
  }, []);

  useEffect(() => {
    // Save token to localStorage whenever it changes
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentToken = token || localStorage.getItem('auth_token');
      
      if (!currentToken) {
        setUser(null);
        return;
      }

      const response = await fetch(config.meEndpoint, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        // If we don't have the token in state but it's in localStorage, set it
        if (!token && currentToken) {
          setToken(currentToken);
        }
      } else {
        setUser(null);
        setToken(null); // Clear invalid token
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
      setToken(null); // Clear token on error
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(config.loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token); // Store JWT token
      setUser(data.user);
      router.push(config.redirectAfterLogin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(config.registerEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      if (data.token) {
        setToken(data.token); // Store JWT token if provided
      }
      setUser(data.user);
      router.push(config.redirectAfterLogin);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      
      const currentToken = token || localStorage.getItem('auth_token');
      if (currentToken) {
        await fetch(config.logoutEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
          },
        });
      }
      
      setUser(null);
      setToken(null); // Clear JWT token
      router.push(config.redirectAfterLogout);
    } catch (err) {
      console.error('Logout failed:', err);
      // Even if logout fails, clear local state
      setUser(null);
      setToken(null); // Clear JWT token
      router.push(config.redirectAfterLogout);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setError(null);
      
      const response = await fetch(config.forgotPasswordEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset email');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email';
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      
      const response = await fetch(config.resetPasswordEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      // Optionally log the user in after password reset
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        router.push(config.redirectAfterLogin);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      throw new Error(message);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 