import { Router } from 'express';
import { z } from 'zod';
import { db } from '@repo/database';
import { teams, users, teamMembers, teamScrumMasters, planningSessions, stories, votes } from '@repo/database';
import { eq, like, or, desc, asc, count, and, isNotNull } from 'drizzle-orm';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  description: z.string().optional(),
  scrumMasterId: z.number().int().positive('Invalid Scrum Master ID').optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').optional(),
  description: z.string().optional(),
  scrumMasterId: z.number().int().positive('Invalid Scrum Master ID').optional().nullable(),
});

// Helper function to get team statistics
const getTeamStatistics = async () => {
  const totalTeams = await db.select({ count: count() }).from(teams);
  const teamsWithScrumMaster = await db
    .select({ count: count() })
    .from(teams)
    .where(isNotNull(teams.scrumMasterId))
    .then(result => result[0]?.count || 0);
  
  const totalMembers = await db.select({ count: count() }).from(teamMembers);
  const avgMembersPerTeam = totalTeams[0].count > 0 ? Math.round(totalMembers[0].count / totalTeams[0].count) : 0;

  return {
    total: totalTeams[0].count,
    withScrumMaster: teamsWithScrumMaster,
    withoutScrumMaster: totalTeams[0].count - teamsWithScrumMaster,
    totalMembers: totalMembers[0].count,
    avgMembersPerTeam
  };
};

// GET /api/teams - Get all teams with pagination and search
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const user = (req as any).user; // Get user from auth middleware
    
    // Admin gets all teams, Scrum Master gets only their teams
    if (user.role === 'ADMIN') {
      return handleAdminTeamsRequest(req, res, next);
    } else if (user.role === 'SCRUM_MASTER') {
      return handleScrumMasterTeamsRequest(req, res, next);
    } else {
      const error = new Error('Access denied. Admin or Scrum Master role required.') as ApiError;
      error.statusCode = 403;
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Admin teams handler (original functionality)
const handleAdminTeamsRequest = async (req: any, res: any, next: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const sortBy = req.query.sortBy as string || 'name';
    const sortOrder = req.query.sortOrder as string || 'asc';
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    if (search) {
      whereConditions.push(
        or(
          like(teams.name, `%${search}%`),
          like(teams.description, `%${search}%`)
        )
      );
    }

    // Get total count for pagination
    const totalResult = await db
      .select({ count: count() })
      .from(teams)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    
    const total = totalResult[0].count;

    // Get teams with sorting and pagination
    let orderByClause;
    if (sortBy === 'name') {
      orderByClause = sortOrder === 'desc' ? desc(teams.name) : asc(teams.name);
    } else if (sortBy === 'createdAt') {
      orderByClause = sortOrder === 'desc' ? desc(teams.createdAt) : asc(teams.createdAt);
    } else {
      orderByClause = asc(teams.name); // Default to name ascending
    }
    
    const allTeams = await db
      .select()
      .from(teams)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    // Get additional data for each team
    const teamsWithDetails = await Promise.all(
      allTeams.map(async (team) => {
        // Get scrum master details
        const scrumMaster = team.scrumMasterId 
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

        // Get team members count
        const membersCount = await db
          .select({ count: count() })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id))
          .then(result => result[0].count);

        // Get planning sessions count
        const sessionsCount = await db
          .select({ count: count() })
          .from(planningSessions)
          .where(eq(planningSessions.teamId, team.id))
          .then(result => result[0].count);

        return {
          ...team,
          scrumMaster,
          membersCount,
          sessionsCount
        };
      })
    );

    // Get statistics
    const statistics = await getTeamStatistics();

    res.json({
      teams: teamsWithDetails,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1
      },
      statistics
    });
  } catch (error) {
    next(error);
  }
};

// Scrum Master teams handler (only managed teams)
const handleScrumMasterTeamsRequest = async (req: any, res: any, next: any) => {
  try {
    const user = req.user;
    const search = req.query.search as string || '';
    
    // Build where conditions for Scrum Master's teams
    let whereCondition;
    if (search) {
      whereCondition = and(
        eq(teams.scrumMasterId, user.id),
        or(
          like(teams.name, `%${search}%`),
          like(teams.description, `%${search}%`)
        )
      );
    } else {
      whereCondition = eq(teams.scrumMasterId, user.id);
    }

    // Get teams managed by this Scrum Master
    const managedTeams = await db
      .select()
      .from(teams)
      .where(whereCondition)
      .orderBy(asc(teams.name));

    // Get additional data for each team
    const teamsWithDetails = await Promise.all(
      managedTeams.map(async (team) => {
        // Get scrum master details (should be the current user)
        const scrumMaster = {
          id: user.id,
          name: user.name,
          email: user.email,
        };

        // Get team members count
        const membersCount = await db
          .select({ count: count() })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, team.id))
          .then(result => result[0].count);

        // Get planning sessions count
        const sessionsCount = await db
          .select({ count: count() })
          .from(planningSessions)
          .where(eq(planningSessions.teamId, team.id))
          .then(result => result[0].count);

        return {
          ...team,
          scrumMaster,
          membersCount,
          sessionsCount
        };
      })
    );

    // Calculate simple statistics for Scrum Master
    const totalMembers = teamsWithDetails.reduce((sum, team) => sum + team.membersCount, 0);
    const statistics = {
      total: teamsWithDetails.length,
      totalMembers,
      avgMembersPerTeam: teamsWithDetails.length > 0 ? Math.round(totalMembers / teamsWithDetails.length) : 0
    };

    res.json({
      teams: teamsWithDetails,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: teamsWithDetails.length,
        itemsPerPage: teamsWithDetails.length,
        hasNextPage: false,
        hasPreviousPage: false
      },
      statistics
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/teams/:id - Get team by ID
router.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id);
    
    if (isNaN(teamId)) {
      const error = new Error('Invalid team ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const teamResult = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamResult.length === 0) {
      const error = new Error('Team not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const team = teamResult[0];

    // Get scrum master details
    const scrumMaster = team.scrumMasterId 
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

    // Get team members
    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        userName: users.name,
        userEmail: users.email,
        createdAt: teamMembers.createdAt
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));

    res.json({
      ...team,
      scrumMaster,
      members
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams - Create new team
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const validatedData = createTeamSchema.parse(req.body);

    // Check if team name already exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.name, validatedData.name))
      .limit(1);

    if (existingTeam.length > 0) {
      const error = new Error('Team name already exists') as ApiError;
      error.statusCode = 409;
      throw error;
    }

    // Validate scrum master if provided
    if (validatedData.scrumMasterId) {
      const scrumMaster = await db
        .select()
        .from(users)
        .where(eq(users.id, validatedData.scrumMasterId))
        .limit(1);

      if (scrumMaster.length === 0) {
        const error = new Error('Scrum Master not found') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      if (!['SCRUM_MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(scrumMaster[0].role)) {
        const error = new Error('Selected user cannot be a Scrum Master') as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    // Create team
    const newTeamResult = await db
      .insert(teams)
      .values({
        name: validatedData.name,
        description: validatedData.description || null,
        scrumMasterId: validatedData.scrumMasterId || null,
      })
      .returning();

    const newTeam = newTeamResult[0];

    // Get scrum master details for response
    const scrumMaster = newTeam.scrumMasterId 
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, newTeam.scrumMasterId))
          .limit(1)
          .then(result => result[0] || null)
      : null;

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: {
        ...newTeam,
        scrumMaster,
        membersCount: 0,
        sessionsCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:id - Update team
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id);
    
    if (isNaN(teamId)) {
      const error = new Error('Invalid team ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const validatedData = updateTeamSchema.parse(req.body);

    // Check if team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (existingTeam.length === 0) {
      const error = new Error('Team not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check if new name conflicts with existing team (if name is being changed)
    if (validatedData.name && validatedData.name !== existingTeam[0].name) {
      const nameConflict = await db
        .select()
        .from(teams)
        .where(and(
          eq(teams.name, validatedData.name),
          eq(teams.id, teamId) // Exclude current team
        ))
        .limit(1);

      if (nameConflict.length > 0) {
        const error = new Error('Team name already exists') as ApiError;
        error.statusCode = 409;
        throw error;
      }
    }

    // Validate scrum master if provided
    if (validatedData.scrumMasterId) {
      const scrumMaster = await db
        .select()
        .from(users)
        .where(eq(users.id, validatedData.scrumMasterId))
        .limit(1);

      if (scrumMaster.length === 0) {
        const error = new Error('Scrum Master not found') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      if (!['SCRUM_MASTER', 'ADMIN', 'SUPER_ADMIN'].includes(scrumMaster[0].role)) {
        const error = new Error('Selected user cannot be a Scrum Master') as ApiError;
        error.statusCode = 400;
        throw error;
      }
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.scrumMasterId !== undefined) updateData.scrumMasterId = validatedData.scrumMasterId;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1) { // Only updatedAt
      const error = new Error('No valid fields to update') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Update team
    const updatedTeamResult = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, teamId))
      .returning();

    const updatedTeam = updatedTeamResult[0];

    // Get scrum master details for response
    const scrumMaster = updatedTeam.scrumMasterId 
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, updatedTeam.scrumMasterId))
          .limit(1)
          .then(result => result[0] || null)
      : null;

    // Get members count
    const membersCount = await db
      .select({ count: count() })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId))
      .then(result => result[0].count);

    // Get sessions count
    const sessionsCount = await db
      .select({ count: count() })
      .from(planningSessions)
      .where(eq(planningSessions.teamId, teamId))
      .then(result => result[0].count);

    res.json({
      success: true,
      message: 'Team updated successfully',
      team: {
        ...updatedTeam,
        scrumMaster,
        membersCount,
        sessionsCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:id - Delete team with cascading cleanup
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const teamId = parseInt(req.params.id);
    
    if (isNaN(teamId)) {
      const error = new Error('Invalid team ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if team exists
    const existingTeam = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (existingTeam.length === 0) {
      const error = new Error('Team not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Cascading delete with cleanup - use transaction for data integrity
    await db.transaction(async (tx) => {
      // 1. Delete votes from stories in planning sessions of this team
      const sessionIds = await tx
        .select({ id: planningSessions.id })
        .from(planningSessions)
        .where(eq(planningSessions.teamId, teamId));

      if (sessionIds.length > 0) {
        const storyIds = await tx
          .select({ id: stories.id })
          .from(stories)
          .where(eq(stories.sessionId, sessionIds[0].id)); // Simplified for this example

        if (storyIds.length > 0) {
          for (const story of storyIds) {
            await tx.delete(votes).where(eq(votes.storyId, story.id));
          }
        }

        // 2. Delete stories
        for (const session of sessionIds) {
          await tx.delete(stories).where(eq(stories.sessionId, session.id));
        }

        // 3. Delete planning sessions
        await tx.delete(planningSessions).where(eq(planningSessions.teamId, teamId));
      }

      // 4. Remove team scrum masters
      await tx.delete(teamScrumMasters).where(eq(teamScrumMasters.teamId, teamId));

      // 5. Remove team members
      await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));

      // 6. Finally delete the team
      await tx.delete(teams).where(eq(teams.id, teamId));
    });

    res.json({
      success: true,
      message: 'Team and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as teamsRoutes };