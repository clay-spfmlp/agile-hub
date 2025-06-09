'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // Don't show logout button if user is not logged in
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${className}`}
    >
      {children || 'Logout'}
    </button>
  );
} 