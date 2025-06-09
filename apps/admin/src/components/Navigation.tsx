'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Teams', href: '/admin/teams' },
  { name: 'Settings', href: '/admin/settings' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">AgileHub</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {user && (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, {user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                >
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 