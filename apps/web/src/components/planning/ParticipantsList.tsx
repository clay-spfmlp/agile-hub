'use client';

import React from 'react';
import { usePlanning } from './PlanningSessionProvider';
import { Participant } from '@/types/planning';

interface ParticipantsListProps {
  className?: string;
}

export function ParticipantsList({ className }: ParticipantsListProps) {
  const { state } = usePlanning();

  if (!state.session) return null;

  const participants = state.session.participants || [];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className || ''}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Participants</h3>
      
      <div className="space-y-3">
        {participants.map((participant) => (
          <ParticipantItem 
            key={participant.id} 
            participant={participant} 
            hasVoted={hasParticipantVoted(participant, state.session)}
          />
        ))}
      </div>
    </div>
  );
}

function ParticipantItem({ 
  participant, 
  hasVoted 
}: { 
  participant: Participant; 
  hasVoted: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-medium text-indigo-600">
              {participant.name.charAt(0).toUpperCase()}
            </span>
          </div>
          {participant.isOnline && (
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{participant.name}</p>
          {participant.role && (
            <p className="text-xs text-gray-500">{participant.role}</p>
          )}
        </div>
      </div>
      
      <div>
        {hasVoted ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Voted
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Waiting
          </span>
        )}
      </div>
    </div>
  );
}

function hasParticipantVoted(participant: Participant, session: any): boolean {
  if (!session.currentStoryId || !session.votes) return false;
  
  return Object.values(session.votes).some(
    (vote: any) => vote.userId === participant.userId && vote.storyId === session.currentStoryId
  );
} 