'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Calendar, 
  ListTodo,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Activity,
  Zap,
  Award
} from 'lucide-react';

interface OverviewMetrics {
  teams: number;
  releases: number;
  sprints: number;
  stories: number;
  users: number;
  planningSessions: number;
}

interface TeamVelocity {
  sprintName: string;
  capacity?: number;
  velocity?: number;
  actualVelocity: number;
  totalStories: number;
  completedStories: number;
  completionRate: number;
  startDate?: string;
  endDate?: string;
  release: {
    name: string;
    version: string;
  };
}

interface StoryDistribution {
  status: string;
  count: number;
  percentage: number;
}

interface Team {
  id: number;
  name: string;
}

const MetricCard = ({ title, value, change, icon: Icon, description }: {
  title: string;
  value: number | string;
  change?: string;
  icon: any;
  description?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {change}
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics | null>(null);
  const [storyDistribution, setStoryDistribution] = useState<StoryDistribution[]>([]);
  const [teamVelocity, setTeamVelocity] = useState<TeamVelocity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchOverviewMetrics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverviewMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStoryDistribution = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/analytics/story-distribution', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStoryDistribution(data.distribution);
      }
    } catch (error) {
      console.error('Error fetching story distribution:', error);
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
        // Only set selectedTeam if it's not already set
        if (data.teams.length > 0) {
          setSelectedTeam(current => current || data.teams[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchTeamVelocity = useCallback(async (teamId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/analytics/team/${teamId}/velocity`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTeamVelocity(data.sprints);
      }
    } catch (error) {
      console.error('Error fetching team velocity:', error);
    }
  }, []);

  useEffect(() => {
    fetchOverviewMetrics();
    fetchStoryDistribution();
    fetchTeams();
  }, [fetchOverviewMetrics, fetchStoryDistribution, fetchTeams]);

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamVelocity(parseInt(selectedTeam));
    }
  }, [selectedTeam, fetchTeamVelocity]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DONE': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'READY': return 'bg-yellow-500';
      case 'BACKLOG': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DONE': return 'Done';
      case 'IN_PROGRESS': return 'In Progress';
      case 'READY': return 'Ready';
      case 'BACKLOG': return 'Backlog';
      default: return status;
    }
  };

  if (loading || !overviewMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          Analytics Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Track performance and insights across your agile teams
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <MetricCard
          title="Teams"
          value={overviewMetrics.teams}
          icon={Users}
          description="Active teams"
        />
        <MetricCard
          title="Releases"
          value={overviewMetrics.releases}
          icon={Package}
          description="Total releases"
        />
        <MetricCard
          title="Sprints"
          value={overviewMetrics.sprints}
          icon={Calendar}
          description="All sprints"
        />
        <MetricCard
          title="Stories"
          value={overviewMetrics.stories}
          icon={ListTodo}
          description="User stories"
        />
        <MetricCard
          title="Users"
          value={overviewMetrics.users}
          icon={Users}
          description="Team members"
        />
        <MetricCard
          title="Sessions"
          value={overviewMetrics.planningSessions}
          icon={Activity}
          description="Planning sessions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Story Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Story Distribution
            </CardTitle>
            <CardDescription>
              Current status distribution of all stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storyDistribution.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                    <span className="text-sm font-medium">{getStatusLabel(item.status)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{item.count}</span>
                    <span className="text-xs text-gray-400">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
              {storyDistribution.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No story data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Velocity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Team Velocity
                </CardTitle>
                <CardDescription>
                  Sprint completion trends
                </CardDescription>
              </div>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamVelocity.slice(-5).map((sprint, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{sprint.sprintName}</h4>
                    <Badge 
                      variant="outline" 
                      className={`${sprint.completionRate >= 80 ? 'bg-green-100 text-green-800' : 
                        sprint.completionRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {sprint.completionRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {sprint.release.name} v{sprint.release.version}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stories: {sprint.completedStories}/{sprint.totalStories}</span>
                    <span>Velocity: {sprint.actualVelocity}</span>
                  </div>
                </div>
              ))}
              {teamVelocity.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No completed sprints available for this team
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and navigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex-col gap-2" asChild>
              <a href="/releases">
                <Package className="h-5 w-5" />
                <span>Manage Releases</span>
              </a>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2" asChild>
              <a href="/sprints">
                <Calendar className="h-5 w-5" />
                <span>Manage Sprints</span>
              </a>
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2" asChild>
              <a href="/planning/setup">
                <Activity className="h-5 w-5" />
                <span>Start Planning</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 