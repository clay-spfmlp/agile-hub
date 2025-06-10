'use client';

import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useSocket } from '@/hooks/useSocket';
import type { PlanningSession, Vote, Participant } from '@/types/planning';

interface PlanningState {
  session: PlanningSession | null;
  currentVote: string | null;
  isVoting: boolean;
  hasVoted: boolean;
  isConnected: boolean;
  error: string | null;
}

type PlanningAction = 
  | { type: 'SESSION_JOINED'; payload: PlanningSession }
  | { type: 'SESSION_UPDATED'; payload: Partial<PlanningSession> }
  | { type: 'VOTE_CAST'; payload: { storyId: string; value: string } }
  | { type: 'VOTES_REVEALED'; payload: { votes: Record<string, Vote> } }
  | { type: 'PARTICIPANT_JOINED'; payload: Participant }
  | { type: 'PARTICIPANT_LEFT'; payload: string }
  | { type: 'CONNECTION_STATUS'; payload: boolean }
  | { type: 'ERROR'; payload: string };

const PlanningContext = createContext<{
  state: PlanningState;
  actions: {
    joinSession: (roomCode: string) => void;
    castVote: (value: string) => void;
    revealVotes: () => void;
    resetVoting: () => void;
    selectStory: (storyId: string) => void;
    createStory: (story: { title: string; description?: string; acceptance?: string }) => void;
    updateStory: (storyId: string, updates: { title?: string; description?: string; acceptance?: string }) => void;
    startVoting: (storyId: string) => void;
    stopVoting: () => void;
  };
} | null>(null);

function planningReducer(state: PlanningState, action: PlanningAction): PlanningState {
  switch (action.type) {
    case 'SESSION_JOINED':
      return {
        ...state,
        session: action.payload,
        error: null,
      };
    
    case 'SESSION_UPDATED':
      return {
        ...state,
        session: state.session ? { ...state.session, ...action.payload } : null,
      };
    
    case 'VOTE_CAST':
      return {
        ...state,
        currentVote: action.payload.value,
        hasVoted: true,
        isVoting: false,
      };
    
    case 'VOTES_REVEALED':
      return {
        ...state,
        session: state.session ? {
          ...state.session,
          votes: action.payload.votes,
          state: 'revealing'
        } : null,
      };
    
    case 'CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload,
      };
    
    case 'ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    default:
      return state;
  }
}

export function PlanningSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(planningReducer, {
    session: null,
    currentVote: null,
    isVoting: false,
    hasVoted: false,
    isConnected: false,
    error: null,
  });

  const { socket, isConnected, on, off } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    on('planning:session_updated', (session) => {
      dispatch({ type: 'SESSION_UPDATED', payload: session });
    });

    on('planning:votes_revealed', (data) => {
      dispatch({ type: 'VOTES_REVEALED', payload: data });
    });

    on('planning:participant_joined', (data) => {
      dispatch({ type: 'PARTICIPANT_JOINED', payload: data.participant });
    });

    on('error', (error) => {
      dispatch({ type: 'ERROR', payload: error.message });
    });

    return () => {
      off('planning:session_updated', (session) => {
        dispatch({ type: 'SESSION_UPDATED', payload: session });
      });
      off('planning:votes_revealed', (data) => {
        dispatch({ type: 'VOTES_REVEALED', payload: data });
      });
      off('planning:participant_joined', (data) => {
        dispatch({ type: 'PARTICIPANT_JOINED', payload: data.participant });
      });
      off('error', (error) => {
        dispatch({ type: 'ERROR', payload: error.message });
      });
    };
  }, [socket, on, off]);

  const actions = {
    joinSession: (roomCode: string) => {
      if (socket) {
        socket.emit('planning:join', { roomCode });
      }
    },
    
    castVote: (value: string) => {
      if (socket && state.session?.currentStoryId) {
        socket.emit('planning:vote_cast', {
          sessionId: state.session.id,
          storyId: state.session.currentStoryId,
          vote: { value, confidence: 5 }
        });
      }
    },
    
    revealVotes: () => {
      if (socket && state.session) {
        socket.emit('planning:votes_revealed', {
          sessionId: state.session.id
        });
      }
    },
    
    resetVoting: () => {
      if (socket && state.session) {
        socket.emit('planning:voting_reset', {
          sessionId: state.session.id
        });
      }
    },
    
    selectStory: (storyId: string) => {
      if (socket && state.session) {
        socket.emit('planning:story_selected', {
          sessionId: state.session.id,
          storyId
        });
      }
    },
    
    createStory: (story: { title: string; description?: string; acceptance?: string }) => {
      if (socket && state.session) {
        socket.emit('planning:story_created', {
          sessionId: state.session.id,
          story: {
            ...story,
            priority: 'MEDIUM' as const,
            status: 'READY' as const
          }
        });
      }
    },
    
    updateStory: (storyId: string, updates: { title?: string; description?: string; acceptance?: string }) => {
      if (socket && state.session) {
        socket.emit('planning:story_updated', {
          sessionId: state.session.id,
          storyId,
          updates
        });
      }
    },
    
    startVoting: (storyId: string) => {
      if (socket && state.session) {
        socket.emit('planning:voting_started', {
          sessionId: state.session.id,
          storyId
        });
      }
    },
    
    stopVoting: () => {
      if (socket && state.session) {
        socket.emit('planning:voting_stopped', {
          sessionId: state.session.id
        });
      }
    }
  };

  return (
    <PlanningContext.Provider value={{ state, actions }}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within PlanningSessionProvider');
  }
  return context;
} 