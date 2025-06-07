import { io, Socket } from 'socket.io-client';
import { PlanningSession, Vote, Participant } from '@/types/planning';

// Socket event types
export const PLANNING_EVENTS = {
  // Session Management
  JOIN_SESSION: 'planning:join',
  LEAVE_SESSION: 'planning:leave',
  SESSION_UPDATED: 'planning:session_updated',
  
  // Story Management
  STORY_SELECTED: 'planning:story_selected',
  STORY_UPDATED: 'planning:story_updated',
  
  // Voting Flow
  VOTING_STARTED: 'planning:voting_started',
  VOTE_CAST: 'planning:vote_cast',
  VOTES_REVEALED: 'planning:votes_revealed',
  VOTING_RESET: 'planning:voting_reset',
  
  // Real-time Updates
  PARTICIPANT_JOINED: 'planning:participant_joined',
  PARTICIPANT_LEFT: 'planning:participant_left',
  TIMER_STARTED: 'planning:timer_started',
  TIMER_EXPIRED: 'planning:timer_expired',
  
  // Moderation
  KICK_PARTICIPANT: 'planning:kick_participant',
  SESSION_LOCKED: 'planning:session_locked',
} as const;

// Socket event handlers
export type SocketEventHandlers = {
  [PLANNING_EVENTS.SESSION_UPDATED]: (session: PlanningSession) => void;
  [PLANNING_EVENTS.VOTE_CAST]: (data: { userId: string; storyId: string; hasVoted: boolean }) => void;
  [PLANNING_EVENTS.VOTES_REVEALED]: (data: { votes: Record<string, Vote>; statistics: any }) => void;
  [PLANNING_EVENTS.PARTICIPANT_JOINED]: (data: { participant: Participant }) => void;
  [PLANNING_EVENTS.PARTICIPANT_LEFT]: (data: { participantId: string }) => void;
  [PLANNING_EVENTS.TIMER_STARTED]: (data: { duration: number; endTime: Date }) => void;
  [PLANNING_EVENTS.TIMER_EXPIRED]: () => void;
  [PLANNING_EVENTS.SESSION_LOCKED]: () => void;
  error: (error: { message: string }) => void;
};

// Socket instance
let socket: Socket | null = null;

// Initialize socket connection
export function initSocket(url: string = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001') {
  if (!socket) {
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
}

// Get socket instance
export function getSocket() {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

// Join planning session
export function joinSession(roomCode: string, userData: { name: string; userId?: string; role?: string; isAnonymous?: boolean }) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.JOIN_SESSION, { roomCode, ...userData });
}

// Cast vote
export function castVote(sessionId: string, storyId: string, vote: { value: string; confidence?: number }) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.VOTE_CAST, { sessionId, storyId, vote });
}

// Reveal votes (Scrum Master only)
export function revealVotes(sessionId: string) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.VOTES_REVEALED, { sessionId });
}

// Reset voting
export function resetVoting(sessionId: string) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.VOTING_RESET, { sessionId });
}

// Select story
export function selectStory(sessionId: string, storyId: string) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.STORY_SELECTED, { sessionId, storyId });
}

// Leave session
export function leaveSession(roomCode: string) {
  const socket = getSocket();
  socket.emit(PLANNING_EVENTS.LEAVE_SESSION, { roomCode });
}

// Disconnect socket
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
} 