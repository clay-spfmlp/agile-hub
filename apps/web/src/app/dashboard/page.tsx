'use client';

import { useAuth, useAuthenticatedFetch } from '@repo/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { 
  Users, 
  Calendar, 
  UserCheck,
  Activity,
  TrendingUp,
  ArrowRight,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface Team {
  id: number;
  name: string;
  description: string | null;
  scrumMasterId: number | null;
  membersCount: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      // Fetch teams managed by this Scrum Master
      const teamsResponse = await authenticatedFetch('http://localhost:8080/api/teams');
      if (!teamsResponse.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const teamsData = await teamsResponse.json();
      
      // Filter teams where user is Scrum Master
      const managedTeams = teamsData.teams?.filter((team: Team) => 
        team.scrumMasterId === Number(user?.id)
      ) || [];
      
      setTeams(managedTeams);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setIsLoadingData(false);
    }
  }, [authenticatedFetch, user?.id]);

  useEffect(() => {
    if (!loading && user) {
      // Role-based redirect logic
      switch (user.role) {
        case 'SCRUM_MASTER':
          // Stay on this page and fetch data
          fetchDashboardData();
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'USER':
        default:
          router.push('/planning');
          break;
      }
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'SCRUM_MASTER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const totalMembers = teams.reduce((sum, team) => sum + (team.membersCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-6 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-2xl blur-xl"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Scrum Master Dashboard
            </h1>
            <p className="text-gray-600 text-lg mt-2">Welcome back, {user?.name}</p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur p-6">
          <CardHeader className="pb-4 px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Teams Managed</CardTitle>
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{teams.length}</div>
            <p className="text-sm text-gray-500">Active teams under your guidance</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur p-6">
          <CardHeader className="pb-4 px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalMembers}</div>
            <p className="text-sm text-gray-500">Total developers across all teams</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur p-6">
          <CardHeader className="pb-4 px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
            <p className="text-sm text-gray-500">Ongoing planning sessions</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur p-6">
          <CardHeader className="pb-4 px-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Sessions</CardTitle>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
            <p className="text-sm text-gray-500">Planning sessions this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Section */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur mb-10">
        <CardHeader className="pb-6">
          <div>
            <CardTitle className="text-2xl mb-2">Your Teams</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Manage your teams and start planning sessions for each team
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingData ? (
            <div className="text-center py-16">
              <Layers className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading your teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teams Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven&apos;t been assigned as Scrum Master to any teams yet.
              </p>
              <Button variant="outline">
                <Link href="/planning">
                  Explore Planning Tool
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="border border-gray-200 hover:shadow-lg transition-shadow p-6">
                  <CardHeader className="pb-4 px-0">
                    <div className="flex items-center justify-between mb-3">
                      <CardTitle className="text-lg font-semibold">{team.name}</CardTitle>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                        {team.membersCount || 0} members
                      </Badge>
                    </div>
                    {team.description && (
                      <CardDescription className="text-sm text-gray-600 leading-relaxed">
                        {team.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 px-0">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{team.membersCount || 0} team members</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Activity className="h-4 w-4" />
                        <span>0 active sessions</span>
                      </div>
                      
                      <div className="pt-4">
                        <Button size="sm" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3">
                          <Link href={`/planning/setup?team=${team.id}`} className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Start Planning
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6">
          <CardHeader className="pb-4 px-0">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Calendar className="h-5 w-5" />
              Planning Sessions
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2">
              Start or join planning sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-0">
            <Button variant="secondary" className="w-full py-3">
              <Link href="/planning/setup" className="flex items-center gap-2">
                Setup Planning
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6">
          <CardHeader className="pb-4 px-0">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription className="text-green-100 mt-2">
              Manage your team members
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-0">
            <Button variant="secondary" className="w-full py-3">
              <Link href="/teams" className="flex items-center gap-2">
                Manage Teams
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-violet-600 text-white p-6">
          <CardHeader className="pb-4 px-0">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription className="text-purple-100 mt-2">
              View team performance insights
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 px-0">
            <Button variant="secondary" className="w-full py-3">
              <Link href="/analytics" className="flex items-center gap-2">
                View Analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
