'use client';

import { useAuth, useAuthenticatedFetch } from '@repo/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { 
  Users, 
  Calendar, 
  Activity,
  Plus,
  Settings
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

export default function TeamsPage() {
  const { user, loading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setError(null);

      // Fetch teams managed by this Scrum Master
      const teamsResponse = await authenticatedFetch('http://localhost:8080/api/teams');
      if (!teamsResponse.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const teamsData = await teamsResponse.json();
      
      // Filter teams where user is Scrum Master or show all for admin
      const managedTeams = user?.role === 'ADMIN' 
        ? teamsData.teams || []
        : teamsData.teams?.filter((team: Team) => team.scrumMasterId === Number(user?.id)) || [];
      
      setTeams(managedTeams);

    } catch (error) {
      console.error('Error fetching teams:', error);
      setError(error instanceof Error ? error.message : 'Failed to load teams');
    } finally {
      setIsLoadingData(false);
    }
  }, [authenticatedFetch, user?.role, user?.id]);

  useEffect(() => {
    if (!loading && user) {
      // Role-based redirect logic
      switch (user.role) {
        case 'SCRUM_MASTER':
        case 'ADMIN':
          // Stay on this page and fetch data
          fetchTeams();
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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'SCRUM_MASTER' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Team Management
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Manage your teams and track their progress
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Teams</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{teams.length}</div>
            <p className="text-sm text-gray-500">Active teams under management</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{totalMembers}</div>
            <p className="text-sm text-gray-500">Total developers across all teams</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">0</div>
            <p className="text-sm text-gray-500">Ongoing planning sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Teams List */}
      <Card className="border-0 shadow-lg bg-white/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-xl">Your Teams</CardTitle>
          <CardDescription>
            Manage your teams and start planning sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-600">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Teams Yet</h3>
              <p className="text-gray-600 mb-6">
                {user.role === 'ADMIN' 
                  ? "No teams have been created yet." 
                  : "You haven't been assigned as Scrum Master to any teams yet."
                }
              </p>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <Card key={team.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                            {team.description && (
                              <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{team.membersCount || 0} members</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>0 active sessions</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {team.membersCount || 0} members
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                          Manage
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 flex items-center gap-2"
                        >
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
    </div>
  );
} 