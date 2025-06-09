import { pgTable, serial, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  role: text('role').notNull().default('USER'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  scrumMasterId: integer('scrum_master_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  role: text('role').notNull().default('MEMBER'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teamScrumMasters = pgTable('team_scrum_masters', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  isLead: boolean('is_lead').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const planningSessions = pgTable('planning_sessions', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  settings: jsonb('settings').notNull().default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const stories = pgTable('stories', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => planningSessions.id),
  title: text('title').notNull(),
  description: text('description'),
  priority: text('priority').notNull().default('medium'),
  storyPoints: integer('story_points'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id').references(() => stories.id),
  userId: integer('user_id').references(() => users.id),
  value: text('value').notNull(),
  confidence: integer('confidence').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  defaultStoryPoints: jsonb('default_story_points').notNull().default('[1, 2, 3, 5, 8, 13, 21]'),
  defaultTShirtSizes: jsonb('default_t_shirt_sizes').notNull().default('["XS", "S", "M", "L", "XL"]'),
  allowCustomVotes: boolean('allow_custom_votes').notNull().default(false),
  requireVoteConfirmation: boolean('require_vote_confirmation').notNull().default(true),
  autoRevealVotes: boolean('auto_reveal_votes').notNull().default(false),
  votingTimeLimit: integer('voting_time_limit').notNull().default(60),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}); 