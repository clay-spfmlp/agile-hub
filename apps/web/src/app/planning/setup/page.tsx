'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthenticatedFetch } from '@repo/auth/hooks/useAuthenticatedFetch';
import { useAuth } from '@repo/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { Textarea } from '@repo/ui/components/base/textarea';
import { Badge } from '@repo/ui/components/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/base/select';
import { Switch } from '@repo/ui/components/base/switch';
import { 
  Users, 
  Settings, 
  Play, 
  Copy, 
  Check, 
  Timer,
  RefreshCw,
  UserPlus,
  Eye,
  Calculator,
  Target,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface Team {
  id: number;
  name: string;
  description: string | null;
  membersCount: number;
}

interface SessionSettings {
  name: string;
  description: string;
  votingScale: 'fibonacci' | 'tshirt' | 'power-of-2' | 'modified-fibonacci';
  timerDuration: number;
  autoReveal: boolean;
  allowRevoting: boolean;
}

interface PlanningSession {
  id: string;
  roomCode: string;
  name: string;
  description?: string;
  status: string;
  participants: any[];
  settings: {
    votingScale: string;
    timerDuration?: number;
    autoReveal: boolean;
    allowRevoting: boolean;
  };
}

const VOTING_SCALES = {
  fibonacci: {
    name: 'Fibonacci',
    description: 'Classic Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89)',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '∞', '?'],
    icon: Calculator
  },
  'modified-fibonacci': {
    name: 'Modified Fibonacci',
    description: 'Modified sequence with half points (0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 100)',
    values: ['0', '0.5', '1', '2', '3', '5', '8', '13', '20', '40', '100', '∞', '?'],
    icon: Target
  },
  tshirt: {
    name: 'T-Shirt Sizes',
    description: 'Simple sizing system (XS, S, M, L, XL, XXL)',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '∞', '?'],
    icon: Users
  },
  'power-of-2': {
    name: 'Powers of 2',
    description: 'Exponential scale (1, 2, 4, 8, 16, 32, 64)',
    values: ['1', '2', '4', '8', '16', '32', '64', '∞', '?'],
    icon: RefreshCw
  }
};

export default function PlanningSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const teamId = searchParams.get('team');
  const [team, setTeam] = useState<Team | null>(null);
  const [session, setSession] = useState<PlanningSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SessionSettings>({
    name: '',
    description: '',
    votingScale: 'fibonacci',
    timerDuration: 0, // No timer by default
    autoReveal: true, // Auto reveal enabled by default
    allowRevoting: true
  });

  // Fetch team details - only after auth is loaded and user is available
  useEffect(() => {
    if (!authLoading && user && teamId) {
      fetchTeamDetails();
    }
  }, [teamId, authLoading, user]);

  const fetchTeamDetails = async () => {
    if (!teamId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`http://localhost:8080/api/teams`);
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      const data = await response.json();
      const teams = data.teams || [];
      const team = teams.find((t: Team) => t.id === parseInt(teamId));
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      setTeam(team);
      setSettings(prev => ({
        ...prev,
        name: `${team.name} Planning Session`,
        description: `Planning session for ${team.name} team`
      }));
    } catch (err: any) {
      console.error('Error fetching team details:', err);
      setError(err.message || 'Failed to load team details');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      const sessionData = {
        ...settings,
        teamId: teamId ? parseInt(teamId) : undefined,
        scrumMasterId: user?.id
      };
      
      const response = await authenticatedFetch('http://localhost:8080/api/planning/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
      const newSession = await response.json();
      setSession(newSession);
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const copyRoomCode = async () => {
    if (session?.roomCode) {
      await navigator.clipboard.writeText(session.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startSession = () => {
    if (session) {
      router.push(`/planning/${session.roomCode}`);
    }
  };

  // Show loading screen while authentication is loading or while loading team details
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">
            {authLoading ? 'Authenticating...' : 'Loading team details...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-2xl blur-xl"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Setup Planning Session
              </h1>
              {team ? (
                <p className="text-lg text-gray-600 mt-2">
                  Setting up session for <span className="font-semibold text-gray-900">{team.name}</span>
                </p>
              ) : (
                <p className="text-lg text-gray-600 mt-2">Configure your planning poker session</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            {team && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-2">
                <Users className="h-4 w-4 mr-2" />
                {team.membersCount} members
              </Badge>
            )}
          </div>
        </div>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50/80 backdrop-blur">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-red-800 font-medium">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchTeamDetails()}
                    className="mt-2 text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!session ? (
          /* Session Setup Form */
          <div className="space-y-8">
            {/* Basic Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold">Session Details</CardTitle>
                <CardDescription className="text-base">
                  Configure the basic information for your planning session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Session Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter session name"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of what will be estimated"
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voting Scale Selection */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold">Voting Scale</CardTitle>
                <CardDescription className="text-base">
                  Choose the scoring system for story point estimation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(VOTING_SCALES).map(([key, scale]) => {
                    const Icon = scale.icon;
                    const isSelected = settings.votingScale === key;
                    return (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg' 
                            : 'hover:bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => setSettings(prev => ({ ...prev, votingScale: key as any }))}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${
                              isSelected
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className={`font-semibold text-base mb-2 ${
                                isSelected ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {scale.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                                {scale.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {scale.values.slice(0, 8).map((value) => (
                                  <Badge 
                                    key={value} 
                                    variant="outline" 
                                    className={`text-xs font-medium ${
                                      isSelected 
                                        ? 'border-blue-200 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                  >
                                    {value}
                                  </Badge>
                                ))}
                                {scale.values.length > 8 && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      isSelected 
                                        ? 'border-blue-200 bg-blue-50 text-blue-700' 
                                        : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                  >
                                    +{scale.values.length - 8} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-semibold">Session Settings</CardTitle>
                <CardDescription className="text-base">
                  Additional configuration options for your session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Label htmlFor="timer" className="text-sm font-medium text-gray-700">Voting Timer</Label>
                    <Select 
                      value={settings.timerDuration.toString()} 
                      onValueChange={(value) => setSettings(prev => ({ ...prev, timerDuration: parseInt(value) }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No Timer</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="180">3 minutes</SelectItem>
                        <SelectItem value="300">5 minutes</SelectItem>
                        <SelectItem value="600">10 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Eye className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Auto-reveal votes</Label>
                        <p className="text-sm text-gray-600">Automatically show votes when everyone has voted</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.autoReveal}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoReveal: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Allow re-voting</Label>
                        <p className="text-sm text-gray-600">Let participants change their votes before reveal</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.allowRevoting}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowRevoting: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create Session Button */}
            <div className="flex justify-center">
              <Button 
                onClick={createSession}
                disabled={!settings.name || isCreating}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-8 py-4 text-base font-semibold shadow-lg"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-3" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Session Created - Show Room Code & Participants */
          <div className="space-y-6">
            {/* Session Created Card */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-green-800">Session Created Successfully!</CardTitle>
                    <CardDescription className="text-green-700">
                      Share the room code with your team members to join
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Room Code */}
            <Card>
              <CardHeader>
                <CardTitle>Room Code</CardTitle>
                <CardDescription>
                  Share this code with team members to join the session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-4xl font-mono font-bold text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      {session.roomCode}
                    </div>
                  </div>
                  <Button
                    onClick={copyRoomCode}
                    variant="outline"
                    className="shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Settings Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Session Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Voting Scale</p>
                    <p className="font-semibold">{VOTING_SCALES[session.settings.votingScale as keyof typeof VOTING_SCALES]?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timer</p>
                    <p className="font-semibold">
                      {session.settings.timerDuration ? `${session.settings.timerDuration / 60} minutes` : 'No timer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Auto-reveal</p>
                    <p className="font-semibold">{session.settings.autoReveal ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Re-voting</p>
                    <p className="font-semibold">{session.settings.allowRevoting ? 'Allowed' : 'Not allowed'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participants Waiting Room */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Participants ({session.participants?.length || 0})
                </CardTitle>
                <CardDescription>
                  Waiting for team members to join the session
                </CardDescription>
              </CardHeader>
              <CardContent>
                {session.participants && session.participants.length > 0 ? (
                  <div className="space-y-2">
                    {session.participants.map((participant, index) => (
                      <div key={participant.id || index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {participant.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{participant.name}</p>
                          <p className="text-sm text-gray-600">{participant.role || 'Team Member'}</p>
                        </div>
                        <div className="ml-auto">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Connected
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No participants yet</p>
                    <p className="text-sm text-gray-500">Share the room code above to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Start Session */}
            <div className="flex justify-center">
              <Button 
                onClick={startSession}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                Enter Planning Session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 