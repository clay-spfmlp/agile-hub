'use client';

import React from 'react';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { 
  UserCheck, 
  LogOut, 
  Users, 
  Play,
  Settings,
  BarChart3,
  Package,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ScrumMasterNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || (user.role !== 'SCRUM_MASTER' && user.role !== 'ADMIN')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      active: pathname === '/dashboard'
    },
    {
      href: '/teams',
      label: 'Teams',
      icon: Users,
      active: pathname.startsWith('/teams')
    },
    {
      href: '/releases',
      label: 'Releases',
      icon: Package,
      active: pathname.startsWith('/releases')
    },
    {
      href: '/sprints',
      label: 'Sprints',
      icon: Calendar,
      active: pathname.startsWith('/sprints')
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: TrendingUp,
      active: pathname.startsWith('/analytics')
    },
    {
      href: '/planning/setup',
      label: 'New Session',
      icon: Play,
      active: pathname.startsWith('/planning/setup')
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname.startsWith('/settings')
    }
  ];

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AgileHub
                </span>
                <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                  Scrum Master
                </Badge>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right section - User info and logout */}
          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden border-t border-gray-200 py-3">
          <nav className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    item.active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
} 