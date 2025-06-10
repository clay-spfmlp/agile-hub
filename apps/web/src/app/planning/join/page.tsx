'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Button } from '@repo/ui/components/base/button';
import { Input } from '@repo/ui/components/base/input';
import { Label } from '@repo/ui/components/base/label';
import { 
  Users, 
  Play, 
  AlertCircle,
  ArrowRight,
  Hash
} from 'lucide-react';
import Link from 'next/link';

export default function JoinPlanningPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!roomCode.trim()) {
      setError('Please enter the room code');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Join the session via API
      const response = await fetch(`http://localhost:8080/api/planning/sessions/${roomCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: username.trim()
        }),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Room not found. Please check the room code.');
        } else if (response.status === 400) {
          throw new Error('Invalid name. Please enter a valid name.');
        } else {
          throw new Error('Unable to join room. Please try again.');
        }
      }

      const { session, participant } = await response.json();
      
      // Store user info in sessionStorage for the room
      sessionStorage.setItem('planning_user', JSON.stringify({
        id: participant.id,
        name: participant.name,
        isGuest: true,
        joinedAt: participant.joinedAt,
        hasJoined: true // Flag to indicate they've already joined
      }));

      // Redirect to the room
      router.push(`/planning/${roomCode.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-md mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-2xl blur-xl"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Join Planning Session
          </h1>
          <p className="text-gray-600">
            Enter your name and room code to join the planning session
          </p>
        </div>

        {/* Join Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-semibold text-center">Join Room</CardTitle>
            <CardDescription className="text-center">
              No account required - just enter your details below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Your Name
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2"
                  maxLength={50}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is how others will see your name in the session
                </p>
              </div>

              <div>
                <Label htmlFor="roomCode" className="text-sm font-medium text-gray-700">
                  Room Code
                </Label>
                <div className="relative mt-2">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="roomCode"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="pl-10 uppercase tracking-wider font-mono"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get the room code from your Scrum Master
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isJoining || !username.trim() || !roomCode.trim()}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Joining Room...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Join Planning Session
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            Don't have a room code? Contact your Scrum Master to get started.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in to your account
            </Link>
            <span className="text-gray-300">•</span>
            <Link 
              href="/planning" 
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Back to Planning
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}