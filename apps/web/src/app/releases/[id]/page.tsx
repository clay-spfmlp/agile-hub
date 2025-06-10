'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@repo/auth';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { 
  Package, 
  Calendar, 
  Target,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Edit,
  Plus,
  Users,
  ListTodo,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface Release {
  id: number;
  name: string;
  version: string;
  description?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  targetDate?: string;
  actualDate?: string;
  goals?: string[];
  team: {
    id: number;
    name: string;
    scrumMaster?: {
      id: number;
      name: string;
      email: string;
    };
  };
  sprints: Sprint[];
  createdAt: string;
}

interface Sprint {
  id: number;
  name: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  capacity?: number;
  velocity?: number;
  storiesCount: number;
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

export default function ReleaseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;
  
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (releaseId) {
      fetchRelease();
    }
  }, [releaseId]);

  const fetchRelease = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/releases/${releaseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRelease(data);
      } else {
        setError('Failed to fetch release details');
      }
    } catch (error) {
      console.error('Error fetching release:', error);
      setError('Error fetching release details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateReleaseProgress = () => {
    if (!release || release.sprints.length === 0) return 0;
    const completedSprints = release.sprints.filter(s => s.status === 'COMPLETED').length;
    return Math.round((completedSprints / release.sprints.length) * 100);
  };

  const getTotalStories = () => {
    if (!release) return 0;
    return release.sprints.reduce((total, sprint) => total + sprint.storiesCount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Release not found</h3>
            <p className="text-gray-600 mb-4">{error || 'The release you&apos;re looking for doesn&apos;t exist.'}</p>
            <Button onClick={() => router.push('/releases')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Releases
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = statusConfig[release.status];
  const StatusIcon = statusInfo.icon;
  const progress = calculateReleaseProgress();
  const totalStories = getTotalStories();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/releases')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Releases
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-blue-600" />
              {release.name}
              <Badge 
                variant="outline" 
                className={`${statusInfo.color} flex items-center gap-1 ml-2`}
              >
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </h1>
            <p className="text-gray-600 mt-1">
              Version {release.version} • {release.team.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Release
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Sprint
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Release Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Release Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {release.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{release.description}</p>
                </div>
              )}

              {release.goals && release.goals.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Goals</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {release.goals.map((goal, index) => (
                      <li key={index} className="text-gray-600">{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Start Date</h4>
                  <p className="text-gray-600">{formatDate(release.startDate)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Target Date</h4>
                  <p className="text-gray-600">{formatDate(release.targetDate)}</p>
                </div>
                {release.actualDate && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Actual Date</h4>
                    <p className="text-gray-600">{formatDate(release.actualDate)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sprints */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sprints ({release.sprints.length})</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sprint
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {release.sprints.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sprints yet</h3>
                  <p className="text-gray-600 mb-4">
                    Get started by creating your first sprint for this release.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sprint
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {release.sprints.map((sprint) => {
                    const sprintStatusInfo = statusConfig[sprint.status];
                    const SprintStatusIcon = sprintStatusInfo.icon;

                    return (
                      <div key={sprint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-medium text-gray-900">{sprint.name}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`${sprintStatusInfo.color} flex items-center gap-1`}
                            >
                              <SprintStatusIcon className="h-3 w-3" />
                              {sprintStatusInfo.label}
                            </Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/sprints/${sprint.id}`}>
                                View
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Stories:</span>
                            <span className="font-medium ml-1">{sprint.storiesCount}</span>
                          </div>
                          {sprint.capacity && (
                            <div>
                              <span className="text-gray-500">Capacity:</span>
                              <span className="font-medium ml-1">{sprint.capacity}</span>
                            </div>
                          )}
                          {sprint.velocity && (
                            <div>
                              <span className="text-gray-500">Velocity:</span>
                              <span className="font-medium ml-1">{sprint.velocity}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Sprint Completion</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{release.sprints.length}</div>
                    <div className="text-gray-600">Total Sprints</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{totalStories}</div>
                    <div className="text-gray-600">Total Stories</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Completed:</span>
                    <span className="font-medium">
                      {release.sprints.filter(s => s.status === 'COMPLETED').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Active:</span>
                    <span className="font-medium">
                      {release.sprints.filter(s => s.status === 'ACTIVE').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Planning:</span>
                    <span className="font-medium">
                      {release.sprints.filter(s => s.status === 'PLANNING').length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{release.team.name}</h4>
                  <p className="text-sm text-gray-600">Development Team</p>
                </div>
                {release.team.scrumMaster && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">Scrum Master</h5>
                    <p className="text-sm text-gray-600">{release.team.scrumMaster.name}</p>
                    <p className="text-xs text-gray-500">{release.team.scrumMaster.email}</p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  View Team Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ListTodo className="h-4 w-4 mr-2" />
                  Manage Stories
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Plan Sprint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 