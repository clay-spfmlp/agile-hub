export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SCRUM_MASTER'
  | 'DEVELOPER'
  | 'TESTER'
  | 'BUSINESS_ANALYST'
  | 'STAKEHOLDER';

export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type SessionState = 'waiting' | 'voting' | 'discussing' | 'revealing' | 'completed';
export type VotingScale = 'fibonacci' | 'tshirt' | 'custom';
export type Priority = 'LOWEST' | 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';
export type StoryStatus = 'DRAFT' | 'READY' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

export interface User {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  userId?: string;
  name: string;
  role?: UserRole;
  isAnonymous: boolean;
  socketId?: string;
  isOnline?: boolean;
  lastSeen?: Date;
  joinedAt: Date;
  leftAt?: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  acceptance?: string;
  storyPoints?: number;
  priority: Priority;
  status: StoryStatus;
  createdById: string;
  sessionId?: string;
  sprintId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: string;
  userId: string;
  sessionId: string;
  storyId: string;
  value: string;
  confidence?: number;
  createdAt: Date;
}

export interface PlanningSession {
  id: string;
  roomCode: string;
  name: string;
  description?: string;
  createdById: string;
  scrumMasterId: string;
  teamId?: string;
  sprintId?: string;
  status: SessionStatus;
  state: SessionState;
  settings: {
    votingScale: VotingScale;
    timerDuration?: number;
    autoReveal: boolean;
    allowRevoting: boolean;
  };
  currentStoryId?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  participants: Participant[];
  stories: Story[];
  votes: Record<string, Vote>;
}

export interface VoteStatistics {
  count: number;
  average: number;
  median: number;
  min: number;
  max: number;
  consensus: number;
  outliers: number[];
}

export interface CreateSessionInput {
  name: string;
  description?: string;
  teamId?: string;
  sprintId?: string;
  votingScale: VotingScale;
  timerDuration?: number;
  autoReveal?: boolean;
  allowRevoting?: boolean;
}

export interface JoinSessionInput {
  userId?: string;
  name: string;
  role?: UserRole;
  isAnonymous?: boolean;
}

export interface VoteInput {
  userId: string;
  storyId: string;
  value: string;
  confidence?: number;
} 