'use client';

import React from 'react';
import { PlanningSessionProvider } from '@/components/planning/PlanningSessionProvider';
import { StoryDisplay } from '@/components/planning/StoryDisplay';
import { VotingInterface } from '@/components/planning/VotingInterface';
import { ParticipantsList } from '@/components/planning/ParticipantsList';

export default function PlanningPage() {
  return (
    <PlanningSessionProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Planning Poker</h1>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Story Display */}
              <div className="lg:col-span-2">
                <StoryDisplay className="mb-6" />
                <VotingInterface />
              </div>
              
              {/* Right Column - Participants */}
              <div>
                <ParticipantsList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </PlanningSessionProvider>
  );
} 