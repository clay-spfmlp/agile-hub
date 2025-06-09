'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PlanningSessionProvider } from '@/components/planning/PlanningSessionProvider';
import { StoryDisplay } from '@/components/planning/StoryDisplay';
import { VotingInterface } from '@/components/planning/VotingInterface';
import { ParticipantsList } from '@/components/planning/ParticipantsList';
import { useAuthenticatedFetch } from '@repo/auth/hooks/useAuthenticatedFetch';
import { useAuth } from '@repo/auth/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { Badge } from '@repo/ui/components/base/badge';
import { 
  Users, 
  ArrowLeft, 
  Copy, 
  Check, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface JoinFormData {
  name: string;
  isAnonymous: boolean;
}

export default function PlanningSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { fetchData } = useAuthenticatedFetch();
  
  const roomCode = params.roomCode as string;
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [joinForm, setJoinForm] = useState<JoinFormData>({
    name: user?.name || '',
    isAnonymous: false
  });

  // Fetch session details
  useEffect(() => {
    if (roomCode) {
      fetchSession();
    }
  }, [roomCode]);

  const fetchSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const sessionData = await fetchData(`/api/planning/sessions?roomCode=${roomCode}`);
      setSession(sessionData);
    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const joinSession = async () => {
    if (!joinForm.name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError(null);
    
    try {
      // Here you would typically join via socket connection
      // For now, just simulate joining
      setHasJoined(true);
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading planning session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <CardTitle className="text-red-800">Session Not Found</CardTitle>
                <CardDescription className="text-red-600">
                  {error}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button onClick={() => router.back()} variant="outline" className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchSession} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-md mx-auto px-4 py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Join Planning Session</CardTitle>
              <CardDescription>
                {session?.name || 'Planning Poker Session'}
              </CardDescription>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-sm text-gray-600">Room Code:</span>
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {roomCode}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyRoomCode}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
              
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={joinForm.name}
                  onChange={(e) => setJoinForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
              
              <Button 
                onClick={joinSession}
                disabled={!joinForm.name.trim() || isJoining}
                className="w-full"
              >
                {isJoining ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Session'
                )}
              </Button>
              
              <div className="text-center">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PlanningSessionProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session?.name || 'Planning Session'}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">Room:</span>
                    <Badge variant="outline" className="font-mono">
                      {roomCode}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyRoomCode}
                      className="h-6 w-6 p-0"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Connected
                </Badge>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Story Display & Voting */}
            <div className="lg:col-span-2 space-y-6">
              <StoryDisplay />
              <VotingInterface />
            </div>
            
            {/* Right Column - Participants */}
            <div>
              <ParticipantsList />
            </div>
          </div>
        </main>
      </div>
    </PlanningSessionProvider>
  );
}
