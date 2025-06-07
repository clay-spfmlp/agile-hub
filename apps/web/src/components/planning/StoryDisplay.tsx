'use client';

import React from 'react';
import { usePlanning } from './PlanningSessionProvider';

interface StoryDisplayProps {
  className?: string;
}

export function StoryDisplay({ className }: StoryDisplayProps) {
  const { state } = usePlanning();

  if (!state.session?.currentStoryId) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">No story selected</p>
        </div>
      </div>
    );
  }

  const currentStory = state.session.stories.find(
    story => story.id === state.session?.currentStoryId
  );

  if (!currentStory) return null;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentStory.title}
        </h2>
        <div className="flex space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            currentStory.priority === 'HIGH' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {currentStory.priority}
          </span>
          {currentStory.storyPoints && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {currentStory.storyPoints} pts
            </span>
          )}
        </div>
      </div>
      
      {currentStory.description && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Description</h4>
          <p className="text-gray-600">
            {currentStory.description}
          </p>
        </div>
      )}
      
      {currentStory.acceptance && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-2">Acceptance Criteria</h4>
          <div className="space-y-2">
            {currentStory.acceptance.split('\n').map((criterion, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm text-gray-600">
                  {criterion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 