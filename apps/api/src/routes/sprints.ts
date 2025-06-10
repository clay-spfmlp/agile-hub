import { Router } from 'express';
import { z } from 'zod';
import { db } from '@repo/database';
import { sprints, stories, releases, teams, users } from '@repo/database';
import { eq, like, or, desc, asc, count, and, isNotNull } from 'drizzle-orm';
import { authenticateToken, requireScrumMasterOrAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Validation schemas
const createSprintSchema = z.object({
  releaseId: z.number().int().positive('Release ID is required'),
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().optional(),
  capacity: z.number().int().min(0, 'Capacity must be non-negative').optional(),
  velocity: z.number().int().min(0, 'Velocity must be non-negative').optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').optional(),
  goal: z.string().optional(),
  capacity: z.number().int().min(0, 'Capacity must be non-negative').optional(),
  velocity: z.number().int().min(0, 'Velocity must be non-negative').optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// Helper function to check if user can access release's sprints
const canAccessReleaseSprints = async (userId: number, userRole: string, releaseId: number): Promise<boolean> => {
  if (userRole === 'ADMIN') return true;
  
  if (userRole === 'SCRUM_MASTER') {
    const releaseWithTeam = await db
      .select({ teamId: releases.teamId, scrumMasterId: teams.scrumMasterId })
      .from(releases)
      .leftJoin(teams, eq(releases.teamId, teams.id))
      .where(eq(releases.id, releaseId))
      .limit(1);
    
    return releaseWithTeam.length > 0 && releaseWithTeam[0].scrumMasterId === userId;
  }
  
  return false;
};

// GET /api/sprints - Get all sprints with filtering and pagination
router.get('/', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const releaseId = req.query.releaseId ? parseInt(req.query.releaseId as string) : undefined;
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = req.query.sortOrder as string || 'asc';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    // Filter by release if specified
    if (releaseId) {
      const canAccess = await canAccessReleaseSprints(user.id, user.role, releaseId);
      if (!canAccess) {
        const error = new Error('Access denied to release sprints') as ApiError;
        error.statusCode = 403;
        throw error;
      }
      whereConditions.push(eq(sprints.releaseId, releaseId));
    } else if (teamId) {
      // Filter by team through releases
      if (user.role === 'SCRUM_MASTER') {
        const team = await db.select().from(teams).where(and(eq(teams.id, teamId), eq(teams.scrumMasterId, user.id))).limit(1);
        if (team.length === 0) {
          const error = new Error('Access denied to team sprints') as ApiError;
          error.statusCode = 403;
          throw error;
        }
      }
      
      const teamReleases = await db.select({ id: releases.id }).from(releases).where(eq(releases.teamId, teamId));
      if (teamReleases.length === 0) {
        return res.json({
          sprints: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false }
        });
      }
      const releaseIds = teamReleases.map(r => r.id);
      whereConditions.push(or(...releaseIds.map(id => eq(sprints.releaseId, id))));
    } else if (user.role === 'SCRUM_MASTER') {
      // Scrum masters can only see sprints from their teams
      const managedTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.scrumMasterId, user.id));
      if (managedTeams.length === 0) {
        return res.json({
          sprints: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false }
        });
      }
      const teamIds = managedTeams.map(t => t.id);
      const teamReleases = await db.select({ id: releases.id }).from(releases).where(or(...teamIds.map(id => eq(releases.teamId, id))));
      
      if (teamReleases.length === 0) {
        return res.json({
          sprints: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false }
        });
      }
      const releaseIds = teamReleases.map(r => r.id);
      whereConditions.push(or(...releaseIds.map(id => eq(sprints.releaseId, id))));
    }

    // Filter by status if specified
    if (status && ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereConditions.push(eq(sprints.status, status as any));
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(sprints.name, `%${search}%`),
          like(sprints.goal, `%${search}%`)
        )
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(sprints)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = totalResult[0].count;

    // Get sprints with sorting and pagination
    let orderByClause;
    if (sortBy === 'name') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.name) : asc(sprints.name);
    } else if (sortBy === 'status') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.status) : asc(sprints.status);
    } else if (sortBy === 'capacity') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.capacity) : asc(sprints.capacity);
    } else if (sortBy === 'velocity') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.velocity) : asc(sprints.velocity);
    } else if (sortBy === 'createdAt') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.createdAt) : asc(sprints.createdAt);
    } else if (sortBy === 'startDate') {
      orderByClause = sortOrder === 'desc' ? desc(sprints.startDate) : asc(sprints.startDate);
    } else {
      orderByClause = asc(sprints.name); // Default to name ascending
    }
    
    const allSprints = await db
      .select()
      .from(sprints)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get additional data for each sprint
    const sprintsWithDetails = await Promise.all(
      allSprints.map(async (sprint) => {
        // Get release and team details
        const releaseWithTeam = await db
          .select({
            releaseId: releases.id,
            releaseName: releases.name,
            releaseVersion: releases.version,
            teamId: teams.id,
            teamName: teams.name,
          })
          .from(releases)
          .leftJoin(teams, eq(releases.teamId, teams.id))
          .where(eq(releases.id, sprint.releaseId))
          .limit(1)
          .then(result => result[0] || null);

        // Get stories count and points
        const storyStats = await db
          .select({ 
            count: count(),
          })
          .from(stories)
          .where(eq(stories.sprintId, sprint.id))
          .then(result => ({
            storiesCount: result[0]?.count || 0,
          }));

        // Get stories by status
        const storiesCompleted = await db
          .select({ count: count() })
          .from(stories)
          .where(and(eq(stories.sprintId, sprint.id), eq(stories.status, 'DONE')))
          .then(result => result[0]?.count || 0);

        const storiesInProgress = await db
          .select({ count: count() })
          .from(stories)
          .where(and(eq(stories.sprintId, sprint.id), eq(stories.status, 'IN_PROGRESS')))
          .then(result => result[0]?.count || 0);

        return {
          ...sprint,
          release: releaseWithTeam ? {
            id: releaseWithTeam.releaseId,
            name: releaseWithTeam.releaseName,
            version: releaseWithTeam.releaseVersion,
          } : null,
          team: releaseWithTeam ? {
            id: releaseWithTeam.teamId,
            name: releaseWithTeam.teamName,
          } : null,
          ...storyStats,
          storiesCompleted,
          storiesInProgress
        };
      })
    );

    res.json({
      sprints: sprintsWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/sprints/:id - Get specific sprint with details
router.get('/:id', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const sprintId = parseInt(req.params.id);

    if (isNaN(sprintId)) {
      const error = new Error('Invalid sprint ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Get sprint
    const sprint = await db
      .select()
      .from(sprints)
      .where(eq(sprints.id, sprintId))
      .limit(1)
      .then(result => result[0]);

    if (!sprint) {
      const error = new Error('Sprint not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessReleaseSprints(user.id, user.role, sprint.releaseId);
    if (!canAccess) {
      const error = new Error('Access denied to this sprint') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Get release and team details
    const releaseWithTeam = await db
      .select({
        releaseId: releases.id,
        releaseName: releases.name,
        releaseVersion: releases.version,
        releaseStatus: releases.status,
        teamId: teams.id,
        teamName: teams.name,
        scrumMasterId: teams.scrumMasterId,
      })
      .from(releases)
      .leftJoin(teams, eq(releases.teamId, teams.id))
      .where(eq(releases.id, sprint.releaseId))
      .limit(1)
      .then(result => result[0]);

    // Get scrum master details
    const scrumMaster = releaseWithTeam?.scrumMasterId 
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, releaseWithTeam.scrumMasterId))
          .limit(1)
          .then(result => result[0] || null)
      : null;

    // Get stories in this sprint
    const sprintStories = await db
      .select()
      .from(stories)
      .where(eq(stories.sprintId, sprintId))
      .orderBy(asc(stories.title));

    // Get stories with assignee details
    const storiesWithDetails = await Promise.all(
      sprintStories.map(async (story) => {
        const assignee = story.assigneeId 
          ? await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
              })
              .from(users)
              .where(eq(users.id, story.assigneeId))
              .limit(1)
              .then(result => result[0] || null)
          : null;

        const createdBy = story.createdById 
          ? await db
              .select({
                id: users.id,
                name: users.name,
                email: users.email,
              })
              .from(users)
              .where(eq(users.id, story.createdById))
              .limit(1)
              .then(result => result[0] || null)
          : null;

        return {
          ...story,
          assignee,
          createdBy
        };
      })
    );

    res.json({
      ...sprint,
      release: releaseWithTeam ? {
        id: releaseWithTeam.releaseId,
        name: releaseWithTeam.releaseName,
        version: releaseWithTeam.releaseVersion,
        status: releaseWithTeam.releaseStatus,
      } : null,
      team: releaseWithTeam ? {
        id: releaseWithTeam.teamId,
        name: releaseWithTeam.teamName,
        scrumMaster
      } : null,
      stories: storiesWithDetails
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sprints - Create new sprint
router.post('/', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const validatedData = createSprintSchema.parse(req.body);

    // Check if user can create sprints for this release
    const canAccess = await canAccessReleaseSprints(user.id, user.role, validatedData.releaseId);
    if (!canAccess) {
      const error = new Error('Access denied to create sprints for this release') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Check if release exists
    const release = await db.select().from(releases).where(eq(releases.id, validatedData.releaseId)).limit(1);
    if (release.length === 0) {
      const error = new Error('Release not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Create sprint
    const newSprint = await db
      .insert(sprints)
      .values({
        releaseId: validatedData.releaseId,
        name: validatedData.name,
        goal: validatedData.goal,
        capacity: validatedData.capacity,
        velocity: validatedData.velocity,
        status: validatedData.status,
        startDate: validatedData.startDate || null,
        endDate: validatedData.endDate || null,
      })
      .returning();

    res.status(201).json({
      message: 'Sprint created successfully',
      sprint: {
        ...newSprint[0],
        release: release[0]
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Validation failed') as ApiError;
      validationError.statusCode = 400;
      validationError.details = error.errors;
      return next(validationError);
    }
    next(error);
  }
});

// PUT /api/sprints/:id - Update sprint
router.put('/:id', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const sprintId = parseInt(req.params.id);
    const validatedData = updateSprintSchema.parse(req.body);

    if (isNaN(sprintId)) {
      const error = new Error('Invalid sprint ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if sprint exists and get current data
    const existingSprint = await db
      .select()
      .from(sprints)
      .where(eq(sprints.id, sprintId))
      .limit(1)
      .then(result => result[0]);

    if (!existingSprint) {
      const error = new Error('Sprint not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessReleaseSprints(user.id, user.role, existingSprint.releaseId);
    if (!canAccess) {
      const error = new Error('Access denied to update this sprint') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate || null;
    }
    if (validatedData.endDate !== undefined) {
      updateData.endDate = validatedData.endDate || null;
    }

    // Update sprint
    const updatedSprint = await db
      .update(sprints)
      .set(updateData)
      .where(eq(sprints.id, sprintId))
      .returning();

    res.json({
      message: 'Sprint updated successfully',
      sprint: updatedSprint[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Validation failed') as ApiError;
      validationError.statusCode = 400;
      validationError.details = error.errors;
      return next(validationError);
    }
    next(error);
  }
});

// DELETE /api/sprints/:id - Delete sprint
router.delete('/:id', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const sprintId = parseInt(req.params.id);

    if (isNaN(sprintId)) {
      const error = new Error('Invalid sprint ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if sprint exists
    const existingSprint = await db
      .select()
      .from(sprints)
      .where(eq(sprints.id, sprintId))
      .limit(1)
      .then(result => result[0]);

    if (!existingSprint) {
      const error = new Error('Sprint not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessReleaseSprints(user.id, user.role, existingSprint.releaseId);
    if (!canAccess) {
      const error = new Error('Access denied to delete this sprint') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Check if sprint has stories
    const storiesCount = await db
      .select({ count: count() })
      .from(stories)
      .where(eq(stories.sprintId, sprintId))
      .then(result => result[0].count);

    if (storiesCount > 0) {
      const error = new Error('Cannot delete sprint with existing stories. Please delete or reassign stories first.') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Delete sprint
    await db.delete(sprints).where(eq(sprints.id, sprintId));

    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as sprintsRoutes }; 