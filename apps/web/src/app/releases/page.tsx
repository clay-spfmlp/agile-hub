'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { Input } from '@repo/ui/components/base/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { releasesApi, teamsApi, handleApiError } from '@/lib/api';
import { CreateReleaseForm } from '@/components/releases/CreateReleaseForm';

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
  };
  sprintsCount: number;
  storiesCount: number;
  createdAt: string;
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
    icon: Package,
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

export default function ReleasesPage() {
  const { user } = useAuth();
  const [releases, setReleases] = useState<Release[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchReleases = useCallback(async () => {
    try {
      setError(null);
      const params: any = {};
      
      if (selectedTeam) params.teamId = parseInt(selectedTeam);
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;

      const data = await releasesApi.list(params);
      setReleases(data.releases || []);
    } catch (err: any) {
      let errorMessage = handleApiError(err);
      
      // Handle specific authentication/authorization errors
      if (err.statusCode === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.statusCode === 403) {
        errorMessage = 'Access denied. You need Scrum Master or Admin permissions to view releases.';
      } else if (err.error && err.error.includes('Access token required')) {
        errorMessage = 'Authentication token is missing. Please log in again.';
      }
      
      setError(errorMessage);
      console.error(`Failed to fetch releases: ${errorMessage}`);
      console.error('Error fetching releases:', err);
    }
  }, [selectedTeam, selectedStatus, searchTerm]);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await teamsApi.list();
      setTeams(data.teams || []);
    } catch (err: any) {
      let errorMessage = 'Failed to fetch teams';
      
      // Handle specific authentication/authorization errors
      if (err.statusCode === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.statusCode === 403) {
        errorMessage = 'Access denied. You need appropriate permissions to view teams.';
      } else if (err.error && err.error.includes('Access token required')) {
        errorMessage = 'Authentication token is missing. Please log in again.';
      }
      
      console.error('Error fetching teams:', errorMessage);
      setError(errorMessage);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    // Check if user is authenticated
    if (!user) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    // Debug: Check token and configuration
    const token = localStorage.getItem('auth_token');
    console.log('Debug - User:', user);
    console.log('Debug - Token exists:', !!token);
    console.log('Debug - Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('Debug - API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');
    
    // Test API connectivity
    try {
      const response = await fetch('http://localhost:8080/api/teams', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      console.log('Debug - API Response Status:', response.status);
      const responseText = await response.text();
      console.log('Debug - API Response:', responseText);
    } catch (err) {
      console.log('Debug - API Connection Error:', err);
    }

    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchReleases(),
        fetchTeams()
      ]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchReleases, fetchTeams, user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (!loading) {
      fetchReleases();
    }
  }, [selectedTeam, selectedStatus, loading, fetchReleases]);

  const handleSearch = () => {
    fetchReleases();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReleases();
      console.log('Releases refreshed');
    } catch (err) {
      console.error('Failed to refresh releases');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchReleases();
    console.log('Release created successfully!');
  };

  const handleDeleteRelease = async (releaseId: number, releaseName: string) => {
    if (!confirm(`Are you sure you want to delete "${releaseName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await releasesApi.delete(releaseId);
      await fetchReleases();
      console.log('Release deleted successfully');
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error(`Failed to delete release: ${errorMessage}`);
      console.error('Error deleting release:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading releases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Releases
          </h1>
          <p className="text-gray-600 mt-2">
            Manage product releases and track progress across teams
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Release
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">Error loading releases</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadInitialData}
                className="ml-auto"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search releases..."
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
                onChange={(e) => setSelectedTeam(e.target.value)}
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

      {/* Releases Grid */}
      {releases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No releases found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedTeam || selectedStatus
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first release.'}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Release
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {releases.map((release) => {
            const statusInfo = statusConfig[release.status];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={release.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{release.name}</CardTitle>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusInfo.color} flex items-center gap-1`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">v{release.version}</span>
                    <span className="text-xs text-gray-500">{release.team.name}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {release.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {release.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Sprints:</span>
                      <span className="font-medium">{release.sprintsCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Stories:</span>
                      <span className="font-medium">{release.storiesCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Target Date:</span>
                      <span className="font-medium">{formatDate(release.targetDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Link href={`/releases/${release.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteRelease(release.id, release.name)}
                      >
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

      {/* Create Release Form */}
      <CreateReleaseForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
        teams={teams}
      />
    </div>
  );
} 