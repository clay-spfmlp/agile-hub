'use client';

import { useAuth } from '@repo/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { StatsCarousel, StatItem } from '@repo/ui/components/stats-carousel';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Activity,
  TrendingUp,
  UserCheck,
  Clock,
  Crown,
  UserX
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-2xl blur-xl"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>

        {/* Platform Statistics */}
        <StatsCarousel stats={[
          {
            title: 'Total Users',
            value: 18,
            icon: Users,
            description: 'All registered users in the platform',
            color: 'from-blue-500 to-blue-600',
            bgColor: 'bg-blue-500/10',
            iconColor: 'text-blue-500'
          },
          {
            title: 'Active Teams',
            value: 16,
            icon: UserCheck,
            description: 'Teams actively using the platform',
            color: 'from-green-500 to-green-600',
            bgColor: 'bg-green-500/10',
            iconColor: 'text-green-500'
          },
          {
            title: 'Administrators',
            value: 2,
            icon: Crown,
            description: 'System administrators with full access',
            color: 'from-purple-500 to-purple-600',
            bgColor: 'bg-purple-500/10',
            iconColor: 'text-purple-500'
          },
          {
            title: 'Scrum Masters',
            value: 5,
            icon: Shield,
            description: 'Team leads managing sprint activities',
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-500/10',
            iconColor: 'text-orange-500'
          },
          {
            title: 'Active Sessions',
            value: 8,
            icon: Activity,
            description: 'Currently running planning sessions',
            color: 'from-indigo-500 to-indigo-600',
            bgColor: 'bg-indigo-500/10',
            iconColor: 'text-indigo-500'
          },
          {
            title: 'Planning Sessions',
            value: 15,
            icon: BarChart3,
            description: 'Total completed sprint planning sessions',
            color: 'from-teal-500 to-teal-600',
            bgColor: 'bg-teal-500/10',
            iconColor: 'text-teal-500'
          }
        ]} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Quick Actions</CardTitle>
              <CardDescription>Manage your AgileHub platform</CardDescription>
            </CardHeader>
            <CardContent className="grid space-y-4">
              <Link href="/admin/users">
                <Button className="w-full justify-start h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                  <Users className="mr-4 h-5 w-5" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/teams">
                <Button className="w-full justify-start h-14 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                  <UserCheck className="mr-4 h-5 w-5" />
                  Manage Teams
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button className="w-full justify-start h-14 bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                  <Settings className="mr-4 h-5 w-5" />
                  System Settings
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">New user registered</p>
                    <p className="text-xs text-gray-500">John Doe joined Frontend Team</p>
                  </div>
                  <div className="text-xs text-gray-400">2m ago</div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Planning session completed</p>
                    <p className="text-xs text-gray-500">Backend Team - Sprint 3 Planning</p>
                  </div>
                  <div className="text-xs text-gray-400">1h ago</div>
                </div>

                <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Settings className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">System settings updated</p>
                    <p className="text-xs text-gray-500">Voting time limit changed to 90s</p>
                  </div>
                  <div className="text-xs text-gray-400">3h ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur mt-8">
          <CardHeader>
            <CardTitle className="text-xl">System Status</CardTitle>
            <CardDescription>Platform health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">1.2s</div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">Active</div>
                <div className="text-sm text-gray-600">Database Status</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 