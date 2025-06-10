// Database entity types
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SCRUM_MASTER' | 'DEVELOPER' | 'TESTER' | 'BUSINESS_ANALYST' | 'STAKEHOLDER' | 'USER';

export type ReleaseStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type StoryStatus = 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
export type StoryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'HIGHEST';

// Core database entities
export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  role: UserRole;
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

export interface TeamMember {
  id: number;
  teamId: number;
  userId: number;
  role: string;
  createdAt: Date;
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
  capacity?: number; // Total story points capacity
  velocity?: number; // Actual completed story points
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: number;
  sessionId?: number;
  sprintId?: number;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  priority: StoryPriority;
  storyPoints?: number;
  status: StoryStatus;
  assigneeId?: number;
  createdById?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vote {
  id: number;
  storyId: number;
  userId: number;
  value: string;
  confidence: number;
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