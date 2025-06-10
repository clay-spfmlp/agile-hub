'use client';

import React, { useState } from 'react';
import { usePlanning } from './PlanningSessionProvider';
import { Vote } from '@/types/planning';

const FIBONACCI_SCALE = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '∞', '?'];
const TSHIRT_SCALE = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '∞', '?'];

interface VotingInterfaceProps {
  className?: string;
}

export function VotingInterface({ className }: VotingInterfaceProps) {
  const { state, actions } = usePlanning();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  if (!state.session || !state.session.currentStoryId) {
    return (
      <div className={`bg-white/80 backdrop-blur rounded-lg shadow-lg p-8 text-center ${className || ''}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🗳️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Vote</h3>
        <p className="text-gray-500">
          Waiting for a story to be selected for estimation
        </p>
      </div>
    );
  }

  const votingScale = state.session.settings?.votingScale === 'fibonacci' 
    ? FIBONACCI_SCALE 
    : TSHIRT_SCALE;

  const isVotingPhase = state.session.state === 'voting';
  const isRevealPhase = state.session.state === 'revealing';
  const isWaiting = state.session.state === 'waiting' || !state.session.state;

  const handleVote = (value: string) => {
    if (!isVotingPhase || state.hasVoted) return;
    
    setSelectedValue(value);
    actions.castVote(value);
  };

  const handleRevealVotes = () => {
    actions.revealVotes();
  };

  // Waiting state - voting hasn't started yet
  if (isWaiting) {
    return (
      <div className={`bg-white/80 backdrop-blur rounded-lg shadow-lg p-8 text-center ${className || ''}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting to Start</h3>
        <p className="text-gray-500 mb-4">
          The Scrum Master will start the voting when ready
        </p>
        {/* Preview voting cards */}
        <div className="grid grid-cols-6 lg:grid-cols-8 gap-2 opacity-50">
          {votingScale.slice(0, 8).map((value) => (
            <div
              key={value}
              className="aspect-[2/3] min-h-[60px] bg-gray-100 rounded-lg flex items-center justify-center"
            >
              <span className="text-lg font-bold text-gray-400">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isRevealPhase) {
    return (
      <div className={`space-y-6 ${className || ''}`}>
        <VotingResults />
        <div className="flex justify-center space-x-4">
          <button 
            onClick={actions.resetVoting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Vote Again
          </button>
          <button 
            onClick={() => actions.selectStory('')}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Next Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/80 backdrop-blur rounded-lg shadow-lg p-6 ${className || ''}`}>
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cast Your Vote</h3>
        <p className="text-gray-600">
          {isVotingPhase 
            ? "Select your estimate for this story" 
            : "Voting is not active yet"
          }
        </p>
      </div>

      {/* Voting Cards */}
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-6">
        {votingScale.map((value) => (
          <div
            key={value}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-105
              aspect-[2/3] min-h-[80px]
              ${selectedValue === value ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}
              ${state.hasVoted && selectedValue !== value ? 'opacity-50' : ''}
              ${!isVotingPhase ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'}
              rounded-lg shadow-sm border-2 border-gray-200 flex items-center justify-center p-2
            `}
            onClick={() => handleVote(value)}
          >
            <span className={`text-2xl font-bold ${
              selectedValue === value ? 'text-blue-600' : 'text-gray-700'
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Voting Status */}
      <div className="text-center space-y-4">
        {isVotingPhase && (
          <>
            {state.hasVoted ? (
              <div className="space-y-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Vote Cast: {selectedValue}
                </span>
                <p className="text-sm text-gray-500">
                  Waiting for other participants to vote...
                </p>
              </div>
            ) : (
              <p className="text-gray-600 font-medium">
                Choose your estimate above
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VotingResults() {
  const { state } = usePlanning();
  
  if (!state.session || !state.session.currentStoryId) return null;
  
  const votes = state.session.votes || {};
  const values = Object.values(votes)
    .map((v: Vote) => parseFloat(v.value))
    .filter(v => !isNaN(v));
  
  if (values.length === 0) return null;
  
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = values.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return (
    <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Voting Results</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Average</p>
          <p className="text-2xl font-bold text-indigo-600">{average.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Median</p>
          <p className="text-2xl font-bold text-indigo-600">{median}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <p className="text-sm text-gray-500 mb-2">Votes</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(votes).map(([userId, vote]: [string, Vote]) => (
            <span 
              key={userId}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {vote.value}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 