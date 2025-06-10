'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { Input } from '@repo/ui/components/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  Users,
  ListTodo
} from 'lucide-react';
import Link from 'next/link';

interface Sprint {
  id: number;
  name: string;
  goal?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  capacity?: number;
  velocity?: number;
  release: {
    id: number;
    name: string;
    version: string;
  };
  team: {
    id: number;
    name: string;
  };
  storiesCount: number;
  storiesCompleted: number;
  storiesInProgress: number;
  createdAt: string;
}

interface Release {
  id: number;
  name: string;
  version: string;
}

interface Team {
  id: number;
  name: string;
}

const statusConfig = {
  PLANNING: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Clock,
    label: 'Planning'
  },
  ACTIVE: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    icon: Target,
    label: 'Active'
  },
  COMPLETED: { 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle2,
    label: 'Completed'
  },
  CANCELLED: { 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: XCircle,
    label: 'Cancelled'
  }
};

export default function SprintsPage() {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedRelease, setSelectedRelease] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchSprints = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (selectedTeam) params.append('teamId', selectedTeam);
      if (selectedRelease) params.append('releaseId', selectedRelease);
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:8080/api/sprints?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSprints(data.sprints);
      } else {
        console.error('Failed to fetch sprints');
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, selectedRelease, selectedStatus, searchTerm]);

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
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  const fetchReleases = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedTeam) params.append('teamId', selectedTeam);

      const response = await fetch(`http://localhost:8080/api/releases?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReleases(data.releases);
      }
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchSprints();
    fetchTeams();
    fetchReleases();
  }, [selectedTeam, selectedRelease, selectedStatus, fetchSprints, fetchTeams, fetchReleases]);

  const handleSearch = () => {
    fetchSprints();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateProgress = (sprint: Sprint) => {
    if (sprint.storiesCount === 0) return 0;
    return Math.round((sprint.storiesCompleted / sprint.storiesCount) * 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Sprints
          </h1>
          <p className="text-gray-600 mt-2">
            Manage sprints and track development progress
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Sprint
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search sprints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedTeam}
                onChange={(e) => {
                  setSelectedTeam(e.target.value);
                  setSelectedRelease(''); // Reset release when team changes
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={!selectedTeam}
              >
                <option value="">All Releases</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.name} v{release.version}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button variant="outline" onClick={handleSearch}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprints Grid */}
      {sprints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sprints found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTeam || selectedRelease || selectedStatus
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first sprint.'}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sprint
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map((sprint) => {
            const statusInfo = statusConfig[sprint.status];
            const StatusIcon = statusInfo.icon;
            const progress = calculateProgress(sprint);
            const progressColor = getProgressColor(progress);

            return (
              <Card key={sprint.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusInfo.color} flex items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600 font-medium">
                      {sprint.release.name} v{sprint.release.version}
                    </span>
                    <span className="text-gray-500">{sprint.team.name}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {sprint.goal && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      <strong>Goal:</strong> {sprint.goal}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${progressColor}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Stories:</span>
                      <span className="font-medium">
                        {sprint.storiesCompleted}/{sprint.storiesCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">In Progress:</span>
                      <span className="font-medium">{sprint.storiesInProgress}</span>
                    </div>
                    {sprint.capacity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Capacity:</span>
                        <span className="font-medium">{sprint.capacity}</span>
                      </div>
                    )}
                    {sprint.velocity && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Velocity:</span>
                        <span className="font-medium">{sprint.velocity}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">
                        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Link href={`/sprints/${sprint.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 