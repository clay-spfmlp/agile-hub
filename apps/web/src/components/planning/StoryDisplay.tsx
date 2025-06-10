'use client';

import React, { useState } from 'react';
import { usePlanning } from './PlanningSessionProvider';
import { useAuth } from '@repo/auth';
import { Button } from '@repo/ui/components/base/button';
import { Badge } from '@repo/ui/components/base/badge';
import { Input } from '@repo/ui/components/base/input';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/base/card';
import { Textarea } from '@repo/ui/components/base/textarea';
import { 
  BookOpen, 
  Play, 
  StopCircle, 
  RotateCcw, 
  Plus,
  Edit3,
  Check,
  X
} from 'lucide-react';

interface StoryDisplayProps {
  className?: string;
}

export function StoryDisplay({ className }: StoryDisplayProps) {
  const { state, actions } = usePlanning();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedStory, setEditedStory] = useState({
    title: '',
    description: '',
    acceptance: ''
  });

  // Check if current user is scrum master
  const isScrumaster = user && state.session && (
    state.session.scrumMasterId === user.id || 
    state.session.createdById === user.id ||
    user.role === 'ADMIN'
  );

  const currentStory = state.session?.stories?.find(
    story => story.id === state.session?.currentStoryId
  );

  const hasStories = state.session?.stories && state.session.stories.length > 0;
  const isVotingActive = state.session?.state === 'voting';
  const isRevealPhase = state.session?.state === 'revealing';

  const handleStartVoting = () => {
    if (state.session && currentStory) {
      actions.startVoting(currentStory.id);
    }
  };

  const handleStopVoting = () => {
    if (state.session) {
      actions.stopVoting();
    }
  };

  const handleRevealVotes = () => {
    actions.revealVotes();
  };

  const handleResetVoting = () => {
    actions.resetVoting();
  };

  const handleCreateDefaultStory = () => {
    if (state.session) {
      actions.createStory({
        title: "Sample User Story",
        description: "As a team member, I want to estimate this story so that we can plan our sprint effectively.",
        acceptance: "The story is properly understood by all team members\nThe story has clear acceptance criteria\nThe team agrees on the estimated effort"
      });
    }
  };

  const handleEditStory = () => {
    if (currentStory) {
      setEditedStory({
        title: currentStory.title,
        description: currentStory.description || '',
        acceptance: currentStory.acceptance || ''
      });
      setIsEditing(true);
    }
  };

  const handleSaveStory = () => {
    if (currentStory && state.session) {
      actions.updateStory(currentStory.id, editedStory);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedStory({ title: '', description: '', acceptance: '' });
  };

  // No stories exist - show default creation
  if (!hasStories) {
    return (
      <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur ${className || ''}`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Stories Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isScrumaster 
                ? "Create your first story to start the planning session. You can add user stories, tasks, or any items that need estimation."
                : "Waiting for the Scrum Master to add stories to estimate."
              }
            </p>
            {isScrumaster && (
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateDefaultStory}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sample Story
                </Button>
                <p className="text-xs text-gray-500">
                  Start with a sample story to get familiar with the interface
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // No story selected but stories exist
  if (!currentStory) {
    return (
      <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur ${className || ''}`}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Select a Story to Estimate
            </h3>
            <p className="text-gray-600 mb-6">
              {isScrumaster 
                ? "Choose a story from your backlog to start the estimation process."
                : "Waiting for the Scrum Master to select a story."
              }
            </p>
            {isScrumaster && state.session && (
              <div className="space-y-2">
                {state.session.stories.map((story) => (
                  <Button
                    key={story.id}
                    variant="outline"
                    onClick={() => actions.selectStory(story.id)}
                    className="w-full justify-start"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {story.title}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur ${className || ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <Input
                value={editedStory.title}
                onChange={(e) => setEditedStory(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-semibold mb-2"
                placeholder="Story title..."
              />
            ) : (
              <CardTitle className="text-xl text-gray-900">
                {currentStory.title}
              </CardTitle>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${
              currentStory.priority === 'HIGH' 
                ? 'bg-red-100 text-red-800' 
                : currentStory.priority === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {currentStory.priority}
            </Badge>
            
            {currentStory.storyPoints && (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                {currentStory.storyPoints} pts
              </Badge>
            )}

            {/* Voting Status Badge */}
            {isVotingActive && (
              <Badge className="bg-green-100 text-green-800 animate-pulse">
                Voting Active
              </Badge>
            )}
            
            {isRevealPhase && (
              <Badge className="bg-blue-100 text-blue-800">
                Votes Revealed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Story Description */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Description</h4>
          {isEditing ? (
            <Textarea
              value={editedStory.description}
              onChange={(e) => setEditedStory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the story requirements..."
              rows={3}
            />
          ) : (
            <p className="text-gray-600">
              {currentStory.description || 'No description provided.'}
            </p>
          )}
        </div>
        
        {/* Acceptance Criteria */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Acceptance Criteria</h4>
          {isEditing ? (
            <Textarea
              value={editedStory.acceptance}
              onChange={(e) => setEditedStory(prev => ({ ...prev, acceptance: e.target.value }))}
              placeholder="Enter acceptance criteria (one per line)..."
              rows={4}
            />
          ) : (
            <div className="space-y-2">
              {currentStory.acceptance ? (
                currentStory.acceptance.split('\n').map((criterion: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-600">
                      {criterion}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No acceptance criteria defined.</p>
              )}
            </div>
          )}
        </div>

        {/* Scrum Master Controls */}
        {isScrumaster && (
          <div className="pt-4 border-t border-gray-200">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveStory} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleEditStory} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Story
                </Button>
                
                {!isVotingActive && !isRevealPhase && (
                  <Button 
                    onClick={handleStartVoting}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Voting
                  </Button>
                )}
                
                {isVotingActive && (
                  <>
                    <Button 
                      onClick={handleStopVoting}
                      variant="outline"
                      size="sm"
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Voting
                    </Button>
                    <Button 
                      onClick={handleRevealVotes}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      size="sm"
                    >
                      Reveal Votes
                    </Button>
                  </>
                )}
                
                {isRevealPhase && (
                  <Button 
                    onClick={handleResetVoting}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    size="sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset & Vote Again
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 