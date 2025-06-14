// Database entity types (temporary - will be imported from @repo/database later)
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SCRUM_MASTER' | 'DEVELOPER' | 'TESTER' | 'BUSINESS_ANALYST' | 'STAKEHOLDER' | 'USER';
export type ReleaseStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type StoryStatus = 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
export type StoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';

// Core database entities
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

export interface Team {
  id: number;
  name: string;
  description?: string;
  scrumMasterId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Release {
  id: number;
  teamId: number;
  name: string;
  description?: string;
  version: string;
  startDate?: Date;
  targetDate?: Date;
  actualDate?: Date;
  status: ReleaseStatus;
  goals?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: number;
  releaseId: number;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status: SprintStatus;
  capacity?: number;
  velocity?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  acceptance?: string;
  storyPoints?: number;
  priority: StoryPriority;
  status: StoryStatus;
  createdById: string;
  sessionId?: string;
  sprintId?: string;
  assigneeId?: string;
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

// Enhanced types with relationships
export interface ReleaseWithSprints extends Release {
  sprints: Sprint[];
  team: Team;
  totalStories: number;
  completedStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

export interface SprintWithStories extends Sprint {
  stories: Story[];
  release: Release;
  assignedStories: number;
  completedStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  burndownData?: SprintBurndownPoint[];
}

export interface StoryWithDetails extends Story {
  sprint?: Sprint;
  assignee?: User;
  createdBy?: User;
  votes?: Vote[];
  estimatedPoints?: number;
}

// API Input/Output types
export interface CreateReleaseInput {
  teamId: number;
  name: string;
  description?: string;
  version: string;
  startDate?: string;
  targetDate?: string;
  goals?: string;
}

export interface UpdateReleaseInput {
  name?: string;
  description?: string;
  version?: string;
  startDate?: string;
  targetDate?: string;
  actualDate?: string;
  status?: ReleaseStatus;
  goals?: string;
}

export interface CreateSprintInput {
  releaseId: number;
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
}

export interface UpdateSprintInput {
  name?: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  capacity?: number;
  velocity?: number;
}

export interface CreateStoryInput {
  sprintId?: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: StoryPriority;
  assigneeId?: number;
  createdById: number;
}

export interface UpdateStoryInput {
  sprintId?: number;
  title?: string;
  description?: string;
  acceptanceCriteria?: string;
  priority?: StoryPriority;
  storyPoints?: number;
  status?: StoryStatus;
  assigneeId?: number;
}

// Analytics and reporting types
export interface SprintBurndownPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
  completedPoints: number;
}

export interface ReleaseBurndownPoint {
  sprintName: string;
  sprintEndDate: string;
  remainingPoints: number;
  idealPoints: number;
  completedPoints: number;
}

export interface TeamVelocity {
  sprintId: number;
  sprintName: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  startDate: Date;
  endDate: Date;
}

export interface ReleaseMetrics {
  releaseId: number;
  releaseName: string;
  totalSprints: number;
  completedSprints: number;
  totalStories: number;
  completedStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  averageVelocity: number;
  progressPercentage: number;
  daysRemaining: number;
  estimatedCompletionDate?: Date;
}

export interface SprintMetrics {
  sprintId: number;
  sprintName: string;
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  todoStories: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  progressPercentage: number;
  daysRemaining: number;
  dailyBurnRate: number;
}

// Planning-specific types
export type SessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type SessionState = 'waiting' | 'voting' | 'discussing' | 'revealing' | 'completed';
export type VotingScale = 'fibonacci' | 'tshirt' | 'custom';

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

export interface PlanningSession {
  id: string;
  roomCode: string;
  name: string;
  description?: string;
  createdById: string;
  scrumMasterId: string;
  teamId?: string;
  sprintId?: string;
  releaseId?: string;
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
  releaseId?: string;
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

// Enhanced planning types with new hierarchy
export interface PlanningSessionWithContext extends PlanningSession {
  team?: Team;
  sprint?: Sprint;
  release?: Release;
}

export interface StoryPlanningData extends Story {
  votes: Vote[];
  statistics?: VoteStatistics;
  isCurrentStory: boolean;
  estimationComplete: boolean;
} 