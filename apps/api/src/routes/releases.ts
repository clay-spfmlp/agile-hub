import { Router } from 'express';
import { z } from 'zod';
import { db } from '@repo/database';
import { releases, sprints, stories, teams, users } from '@repo/database';
import { eq, like, or, desc, asc, count, and, isNotNull } from 'drizzle-orm';
import { authenticateToken, requireScrumMasterOrAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Validation schemas
const createReleaseSchema = z.object({
  teamId: z.number().int().positive('Team ID is required'),
  name: z.string().min(1, 'Release name is required'),
  version: z.string().min(1, 'Version is required'),
  description: z.string().optional(),
  goals: z.array(z.string()).default([]),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  actualDate: z.string().optional(),
});

const updateReleaseSchema = z.object({
  name: z.string().min(1, 'Release name is required').optional(),
  version: z.string().min(1, 'Version is required').optional(),
  description: z.string().optional(),
  goals: z.array(z.string()).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  actualDate: z.string().optional().nullable(),
});

// Helper function to check if user can access team's releases
const canAccessTeamReleases = async (userId: number, userRole: string, teamId: number): Promise<boolean> => {
  if (userRole === 'ADMIN') return true;
  
  if (userRole === 'SCRUM_MASTER') {
    const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    return team.length > 0 && team[0].scrumMasterId === userId;
  }
  
  return false;
};

// GET /api/releases - Get all releases with filtering and pagination
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = req.query.sortOrder as string || 'asc';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    // Filter by team if specified
    if (teamId) {
      const canAccess = await canAccessTeamReleases(user.id, user.role, teamId);
      if (!canAccess) {
        const error = new Error('Access denied to team releases') as ApiError;
        error.statusCode = 403;
        throw error;
      }
      whereConditions.push(eq(releases.teamId, teamId));
    } else if (user.role === 'SCRUM_MASTER') {
      // Scrum masters can only see releases from their teams
      const managedTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.scrumMasterId, user.id));
      if (managedTeams.length === 0) {
        return res.json({
          releases: [],
          pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: limit, hasNextPage: false, hasPreviousPage: false }
        });
      }
      const teamIds = managedTeams.map(t => t.id);
      whereConditions.push(or(...teamIds.map(id => eq(releases.teamId, id))));
    }

    // Filter by status if specified
    if (status && ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'].includes(status)) {
      whereConditions.push(eq(releases.status, status as any));
    }

    // Search filter
    if (search) {
      whereConditions.push(
        or(
          like(releases.name, `%${search}%`),
          like(releases.version, `%${search}%`),
          like(releases.description, `%${search}%`)
        )
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(releases)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = totalResult[0].count;

    // Get releases with sorting and pagination
    let orderByClause;
    if (sortBy === 'name') {
      orderByClause = sortOrder === 'desc' ? desc(releases.name) : asc(releases.name);
    } else if (sortBy === 'version') {
      orderByClause = sortOrder === 'desc' ? desc(releases.version) : asc(releases.version);
    } else if (sortBy === 'status') {
      orderByClause = sortOrder === 'desc' ? desc(releases.status) : asc(releases.status);
    } else if (sortBy === 'createdAt') {
      orderByClause = sortOrder === 'desc' ? desc(releases.createdAt) : asc(releases.createdAt);
    } else if (sortBy === 'startDate') {
      orderByClause = sortOrder === 'desc' ? desc(releases.startDate) : asc(releases.startDate);
    } else {
      orderByClause = asc(releases.name); // Default to name ascending
    }
    
    const allReleases = await db
      .select()
      .from(releases)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get additional data for each release
    const releasesWithDetails = await Promise.all(
      allReleases.map(async (release) => {
        // Get team details
        const team = await db
          .select({
            id: teams.id,
            name: teams.name,
          })
          .from(teams)
          .where(eq(teams.id, release.teamId))
          .limit(1)
          .then(result => result[0] || null);

        // Get sprints count
        const sprintsCount = await db
          .select({ count: count() })
          .from(sprints)
          .where(eq(sprints.releaseId, release.id))
          .then(result => result[0].count);

        // Get stories count (through sprints)
        const storiesCountResult = await db
          .select({ count: count() })
          .from(stories)
          .leftJoin(sprints, eq(stories.sprintId, sprints.id))
          .where(eq(sprints.releaseId, release.id))
          .then(result => result[0].count);

        return {
          ...release,
          team,
          sprintsCount,
          storiesCount: storiesCountResult
        };
      })
    );

    res.json({
      releases: releasesWithDetails,
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

// GET /api/releases/:id - Get specific release with details
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const user = req.user!;
    const releaseId = parseInt(req.params.id);

    if (isNaN(releaseId)) {
      const error = new Error('Invalid release ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Get release
    const release = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1)
      .then(result => result[0]);

    if (!release) {
      const error = new Error('Release not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessTeamReleases(user.id, user.role, release.teamId);
    if (!canAccess) {
      const error = new Error('Access denied to this release') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Get team details
    const team = await db
      .select({
        id: teams.id,
        name: teams.name,
        scrumMasterId: teams.scrumMasterId,
      })
      .from(teams)
      .where(eq(teams.id, release.teamId))
      .limit(1)
      .then(result => result[0]);

    // Get scrum master details
    const scrumMaster = team?.scrumMasterId 
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, team.scrumMasterId))
          .limit(1)
          .then(result => result[0] || null)
      : null;

    // Get sprints in this release
    const releaseSprints = await db
      .select()
      .from(sprints)
      .where(eq(sprints.releaseId, releaseId))
      .orderBy(asc(sprints.name));

    // Get stories count for each sprint
    const sprintsWithStoryCounts = await Promise.all(
      releaseSprints.map(async (sprint) => {
        const storiesCount = await db
          .select({ count: count() })
          .from(stories)
          .where(eq(stories.sprintId, sprint.id))
          .then(result => result[0].count);

        return {
          ...sprint,
          storiesCount
        };
      })
    );

    res.json({
      ...release,
      team: {
        ...team,
        scrumMaster
      },
      sprints: sprintsWithStoryCounts
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/releases - Create new release
router.post('/', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const validatedData = createReleaseSchema.parse(req.body);

    // Check if user can create releases for this team
    const canAccess = await canAccessTeamReleases(user.id, user.role, validatedData.teamId);
    if (!canAccess) {
      const error = new Error('Access denied to create releases for this team') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Check if team exists
    const team = await db.select().from(teams).where(eq(teams.id, validatedData.teamId)).limit(1);
    if (team.length === 0) {
      const error = new Error('Team not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Create release
    const newRelease = await db
      .insert(releases)
      .values({
        teamId: validatedData.teamId,
        name: validatedData.name,
        version: validatedData.version,
        description: validatedData.description,
        status: validatedData.status,
        goals: JSON.stringify(validatedData.goals),
        startDate: validatedData.startDate || null,
        targetDate: validatedData.targetDate || null,
        actualDate: validatedData.actualDate || null,
      })
      .returning();

    res.status(201).json({
      message: 'Release created successfully',
      release: {
        ...newRelease[0],
        goals: validatedData.goals,
        team: team[0]
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

// PUT /api/releases/:id - Update release
router.put('/:id', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const releaseId = parseInt(req.params.id);
    const validatedData = updateReleaseSchema.parse(req.body);

    if (isNaN(releaseId)) {
      const error = new Error('Invalid release ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if release exists and get current data
    const existingRelease = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1)
      .then(result => result[0]);

    if (!existingRelease) {
      const error = new Error('Release not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessTeamReleases(user.id, user.role, existingRelease.teamId);
    if (!canAccess) {
      const error = new Error('Access denied to update this release') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Prepare update data
    const updateData: any = { ...validatedData };
    if (validatedData.goals) {
      updateData.goals = JSON.stringify(validatedData.goals);
    }
    if (validatedData.startDate !== undefined) {
      updateData.startDate = validatedData.startDate || null;
    }
    if (validatedData.targetDate !== undefined) {
      updateData.targetDate = validatedData.targetDate || null;
    }
    if (validatedData.actualDate !== undefined) {
      updateData.actualDate = validatedData.actualDate || null;
    }

    // Update release
    const updatedRelease = await db
      .update(releases)
      .set(updateData)
      .where(eq(releases.id, releaseId))
      .returning();

    res.json({
      message: 'Release updated successfully',
      release: {
        ...updatedRelease[0],
        goals: validatedData.goals || JSON.parse(existingRelease.goals || '[]')
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

// DELETE /api/releases/:id - Delete release
router.delete('/:id', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const releaseId = parseInt(req.params.id);

    if (isNaN(releaseId)) {
      const error = new Error('Invalid release ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if release exists
    const existingRelease = await db
      .select()
      .from(releases)
      .where(eq(releases.id, releaseId))
      .limit(1)
      .then(result => result[0]);

    if (!existingRelease) {
      const error = new Error('Release not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check access
    const canAccess = await canAccessTeamReleases(user.id, user.role, existingRelease.teamId);
    if (!canAccess) {
      const error = new Error('Access denied to delete this release') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Check if release has sprints
    const sprintsCount = await db
      .select({ count: count() })
      .from(sprints)
      .where(eq(sprints.releaseId, releaseId))
      .then(result => result[0].count);

    if (sprintsCount > 0) {
      const error = new Error('Cannot delete release with existing sprints. Please delete or reassign sprints first.') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Delete release
    await db.delete(releases).where(eq(releases.id, releaseId));

    res.json({ message: 'Release deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as releasesRoutes }; 