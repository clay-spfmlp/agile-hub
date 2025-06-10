import { Router } from 'express';
import { db } from '@repo/database';
import { teams, releases, sprints, stories, users, votes, planningSessions } from '@repo/database';
import { eq, like, or, desc, asc, count, and, isNotNull, gte, lte, sql } from 'drizzle-orm';
import { authenticateToken, requireScrumMasterOrAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Helper function to check if user can access team analytics
const canAccessTeamAnalytics = async (userId: number, userRole: string, teamId?: number): Promise<boolean> => {
  if (userRole === 'ADMIN') return true;
  
  if (userRole === 'SCRUM_MASTER') {
    if (teamId) {
      const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
      return team.length > 0 && team[0].scrumMasterId === userId;
    } else {
      // Can access analytics for all their managed teams
      return true;
    }
  }
  
  return false;
};

// Helper function to get user's accessible team IDs
const getUserTeamIds = async (userId: number, userRole: string): Promise<number[]> => {
  if (userRole === 'ADMIN') {
    const allTeams = await db.select({ id: teams.id }).from(teams);
    return allTeams.map(t => t.id);
  }
  
  if (userRole === 'SCRUM_MASTER') {
    const managedTeams = await db.select({ id: teams.id }).from(teams).where(eq(teams.scrumMasterId, userId));
    return managedTeams.map(t => t.id);
  }
  
  return [];
};

// GET /api/analytics/overview - Get overall analytics overview
router.get('/overview', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;

    // Check access
    const canAccess = await canAccessTeamAnalytics(user.id, user.role, teamId);
    if (!canAccess) {
      const error = new Error('Access denied to analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    const userTeamIds = await getUserTeamIds(user.id, user.role);
    const targetTeamIds = teamId ? [teamId] : userTeamIds;

    if (targetTeamIds.length === 0) {
      return res.json({
        teams: 0,
        releases: 0,
        sprints: 0,
        stories: 0,
        users: 0,
        planningSessions: 0
      });
    }

    // Get counts for accessible teams
    const teamsCount = targetTeamIds.length;

    const releasesCount = await db
      .select({ count: count() })
      .from(releases)
      .where(or(...targetTeamIds.map(id => eq(releases.teamId, id))))
      .then(result => result[0]?.count || 0);

    const sprintsCount = await db
      .select({ count: count() })
      .from(sprints)
      .leftJoin(releases, eq(sprints.releaseId, releases.id))
      .where(or(...targetTeamIds.map(id => eq(releases.teamId, id))))
      .then(result => result[0]?.count || 0);

    const storiesCount = await db
      .select({ count: count() })
      .from(stories)
      .leftJoin(sprints, eq(stories.sprintId, sprints.id))
      .leftJoin(releases, eq(sprints.releaseId, releases.id))
      .where(or(...targetTeamIds.map(id => eq(releases.teamId, id))))
      .then(result => result[0]?.count || 0);

    const usersCount = await db
      .select({ count: count() })
      .from(users)
      .then(result => result[0]?.count || 0);

    const planningSessionsCount = await db
      .select({ count: count() })
      .from(planningSessions)
      .where(or(...targetTeamIds.map(id => eq(planningSessions.teamId, id))))
      .then(result => result[0]?.count || 0);

    res.json({
      teams: teamsCount,
      releases: releasesCount,
      sprints: sprintsCount,
      stories: storiesCount,
      users: usersCount,
      planningSessions: planningSessionsCount
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/team/:teamId/velocity - Get team velocity over time
router.get('/team/:teamId/velocity', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const teamId = parseInt(req.params.teamId);

    if (isNaN(teamId)) {
      const error = new Error('Invalid team ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check access
    const canAccess = await canAccessTeamAnalytics(user.id, user.role, teamId);
    if (!canAccess) {
      const error = new Error('Access denied to team analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Get completed sprints with their story counts
    const completedSprints = await db
      .select({
        sprintId: sprints.id,
        sprintName: sprints.name,
        capacity: sprints.capacity,
        velocity: sprints.velocity,
        startDate: sprints.startDate,
        endDate: sprints.endDate,
        releaseName: releases.name,
        releaseVersion: releases.version,
      })
      .from(sprints)
      .leftJoin(releases, eq(sprints.releaseId, releases.id))
      .where(and(
        eq(releases.teamId, teamId),
        eq(sprints.status, 'COMPLETED')
      ))
      .orderBy(asc(sprints.startDate));

    // Get story counts for each sprint
    const sprintMetrics = await Promise.all(
      completedSprints.map(async (sprint) => {
        const completedStories = await db
          .select({ count: count() })
          .from(stories)
          .where(and(
            eq(stories.sprintId, sprint.sprintId),
            eq(stories.status, 'DONE')
          ))
          .then(result => result[0]?.count || 0);

        const totalStories = await db
          .select({ count: count() })
          .from(stories)
          .where(eq(stories.sprintId, sprint.sprintId))
          .then(result => result[0]?.count || 0);

        return {
          sprintName: sprint.sprintName,
          capacity: sprint.capacity,
          velocity: sprint.velocity,
          actualVelocity: completedStories,
          totalStories,
          completedStories,
          completionRate: totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          release: {
            name: sprint.releaseName,
            version: sprint.releaseVersion,
          }
        };
      })
    );

    // Calculate average velocity
    const avgVelocity = sprintMetrics.length > 0 
      ? Math.round(sprintMetrics.reduce((sum, sprint) => sum + sprint.actualVelocity, 0) / sprintMetrics.length)
      : 0;

    res.json({
      teamId,
      sprints: sprintMetrics,
      averageVelocity: avgVelocity,
      totalSprints: sprintMetrics.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/team/:teamId/burndown - Get current sprint burndown
router.get('/team/:teamId/burndown', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const teamId = parseInt(req.params.teamId);
    const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;

    if (isNaN(teamId)) {
      const error = new Error('Invalid team ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check access
    const canAccess = await canAccessTeamAnalytics(user.id, user.role, teamId);
    if (!canAccess) {
      const error = new Error('Access denied to team analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Get current active sprint if sprintId not provided
    let targetSprint;
    if (sprintId) {
      targetSprint = await db
        .select()
        .from(sprints)
        .leftJoin(releases, eq(sprints.releaseId, releases.id))
        .where(and(
          eq(sprints.id, sprintId),
          eq(releases.teamId, teamId)
        ))
        .limit(1)
        .then(result => result[0]);
    } else {
      targetSprint = await db
        .select()
        .from(sprints)
        .leftJoin(releases, eq(sprints.releaseId, releases.id))
        .where(and(
          eq(releases.teamId, teamId),
          eq(sprints.status, 'ACTIVE')
        ))
        .limit(1)
        .then(result => result[0]);
    }

    if (!targetSprint) {
      return res.json({
        sprint: null,
        burndownData: [],
        totalStories: 0,
        completedStories: 0,
        remainingStories: 0
      });
    }

    // Get sprint stories
    const sprintStories = await db
      .select({
        id: stories.id,
        status: stories.status,
        createdAt: stories.createdAt,
        updatedAt: stories.updatedAt,
      })
      .from(stories)
      .where(eq(stories.sprintId, targetSprint.sprints.id));

    const totalStories = sprintStories.length;
    const completedStories = sprintStories.filter(s => s.status === 'DONE').length;
    const remainingStories = totalStories - completedStories;

    // Generate burndown chart data (simplified - in production you'd track daily progress)
    const burndownData = [];
    const sprintDuration = 14; // Assuming 2-week sprints
    
    for (let day = 0; day <= sprintDuration; day++) {
      const ideal = Math.max(0, totalStories - (totalStories * day / sprintDuration));
      const actual = day === sprintDuration ? remainingStories : null; // Only show actual for current day
      
      burndownData.push({
        day,
        ideal: Math.round(ideal * 10) / 10,
        actual: actual !== null ? actual : undefined
      });
    }

    res.json({
      sprint: {
        id: targetSprint.sprints.id,
        name: targetSprint.sprints.name,
        status: targetSprint.sprints.status,
        startDate: targetSprint.sprints.startDate,
        endDate: targetSprint.sprints.endDate,
      },
      burndownData,
      totalStories,
      completedStories,
      remainingStories,
      completionRate: totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/release/:releaseId/progress - Get release progress
router.get('/release/:releaseId/progress', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const releaseId = parseInt(req.params.releaseId);

    if (isNaN(releaseId)) {
      const error = new Error('Invalid release ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Get release and check access
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

    const canAccess = await canAccessTeamAnalytics(user.id, user.role, release.teamId);
    if (!canAccess) {
      const error = new Error('Access denied to release analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    // Get release sprints with progress
    const releaseSprints = await db
      .select()
      .from(sprints)
      .where(eq(sprints.releaseId, releaseId))
      .orderBy(asc(sprints.startDate));

    const sprintProgressData = await Promise.all(
      releaseSprints.map(async (sprint) => {
        const totalStories = await db
          .select({ count: count() })
          .from(stories)
          .where(eq(stories.sprintId, sprint.id))
          .then(result => result[0]?.count || 0);

        const completedStories = await db
          .select({ count: count() })
          .from(stories)
          .where(and(
            eq(stories.sprintId, sprint.id),
            eq(stories.status, 'DONE')
          ))
          .then(result => result[0]?.count || 0);

        const inProgressStories = await db
          .select({ count: count() })
          .from(stories)
          .where(and(
            eq(stories.sprintId, sprint.id),
            eq(stories.status, 'IN_PROGRESS')
          ))
          .then(result => result[0]?.count || 0);

        return {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          capacity: sprint.capacity,
          velocity: sprint.velocity,
          totalStories,
          completedStories,
          inProgressStories,
          remainingStories: totalStories - completedStories - inProgressStories,
          completionRate: totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0
        };
      })
    );

    // Calculate overall release progress
    const totalStoriesInRelease = sprintProgressData.reduce((sum, sprint) => sum + sprint.totalStories, 0);
    const completedStoriesInRelease = sprintProgressData.reduce((sum, sprint) => sum + sprint.completedStories, 0);
    const inProgressStoriesInRelease = sprintProgressData.reduce((sum, sprint) => sum + sprint.inProgressStories, 0);

    res.json({
      release: {
        id: release.id,
        name: release.name,
        version: release.version,
        status: release.status,
        startDate: release.startDate,
        targetDate: release.targetDate,
        actualDate: release.actualDate,
      },
      sprints: sprintProgressData,
      overallProgress: {
        totalStories: totalStoriesInRelease,
        completedStories: completedStoriesInRelease,
        inProgressStories: inProgressStoriesInRelease,
        remainingStories: totalStoriesInRelease - completedStoriesInRelease - inProgressStoriesInRelease,
        completionRate: totalStoriesInRelease > 0 ? Math.round((completedStoriesInRelease / totalStoriesInRelease) * 100) : 0,
        sprintsCompleted: sprintProgressData.filter(s => s.status === 'COMPLETED').length,
        sprintsActive: sprintProgressData.filter(s => s.status === 'ACTIVE').length,
        sprintsPlanning: sprintProgressData.filter(s => s.status === 'PLANNING').length,
        totalSprints: sprintProgressData.length,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/planning-sessions - Get planning session analytics
router.get('/planning-sessions', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check access
    const canAccess = await canAccessTeamAnalytics(user.id, user.role, teamId);
    if (!canAccess) {
      const error = new Error('Access denied to planning analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    const userTeamIds = await getUserTeamIds(user.id, user.role);
    const targetTeamIds = teamId ? [teamId] : userTeamIds;

    if (targetTeamIds.length === 0) {
      return res.json({
        sessions: [],
        statistics: {
          totalSessions: 0,
          averageParticipants: 0,
          averageVotes: 0,
          mostActiveTeam: null
        }
      });
    }

    // Get recent planning sessions
    const recentSessions = await db
      .select({
        sessionId: planningSessions.id,
        sessionName: planningSessions.name,
        status: planningSessions.status,
        createdAt: planningSessions.createdAt,
        teamId: teams.id,
        teamName: teams.name,
      })
      .from(planningSessions)
      .leftJoin(teams, eq(planningSessions.teamId, teams.id))
      .where(or(...targetTeamIds.map(id => eq(planningSessions.teamId, id))))
      .orderBy(desc(planningSessions.createdAt))
      .limit(limit);

    // Get vote counts for each session (through stories)
    const sessionsWithStats = await Promise.all(
      recentSessions.map(async (session) => {
        const sessionStories = await db
          .select({ id: stories.id })
          .from(stories)
          .where(eq(stories.sessionId, session.sessionId));

        const storyIds = sessionStories.map(s => s.id);
        
        const votesCount = storyIds.length > 0 ? await db
          .select({ count: count() })
          .from(votes)
          .where(or(...storyIds.map(id => eq(votes.storyId, id))))
          .then(result => result[0]?.count || 0) : 0;

        return {
          id: session.sessionId,
          name: session.sessionName,
          status: session.status,
          createdAt: session.createdAt,
          team: {
            id: session.teamId,
            name: session.teamName,
          },
          votesCount
        };
      })
    );

    // Calculate statistics
    const totalSessions = await db
      .select({ count: count() })
      .from(planningSessions)
      .where(or(...targetTeamIds.map(id => eq(planningSessions.teamId, id))))
      .then(result => result[0]?.count || 0);

    // Get total votes through stories
    const allSessionStories = await db
      .select({ id: stories.id })
      .from(stories)
      .leftJoin(planningSessions, eq(stories.sessionId, planningSessions.id))
      .where(or(...targetTeamIds.map(id => eq(planningSessions.teamId, id))));

    const allStoryIds = allSessionStories.map(s => s.id);
    const totalVotes = allStoryIds.length > 0 ? await db
      .select({ count: count() })
      .from(votes)
      .where(or(...allStoryIds.map(id => eq(votes.storyId, id))))
      .then(result => result[0]?.count || 0) : 0;

    const averageVotes = totalSessions > 0 ? Math.round(totalVotes / totalSessions) : 0;

    // Find most active team
    const teamActivity = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        sessionCount: count(planningSessions.id),
      })
      .from(teams)
      .leftJoin(planningSessions, eq(teams.id, planningSessions.teamId))
      .where(or(...targetTeamIds.map(id => eq(teams.id, id))))
      .groupBy(teams.id, teams.name)
      .orderBy(desc(count(planningSessions.id)))
      .limit(1)
      .then(result => result[0] || null);

    res.json({
      sessions: sessionsWithStats,
      statistics: {
        totalSessions,
        averageParticipants: 0, // Would need to track participants separately
        averageVotes,
        mostActiveTeam: teamActivity ? {
          id: teamActivity.teamId,
          name: teamActivity.teamName,
          sessionCount: teamActivity.sessionCount
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/story-distribution - Get story status distribution
router.get('/story-distribution', authenticateToken, requireScrumMasterOrAdmin, async (req, res, next) => {
  try {
    const user = req.user!;
    const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
    const sprintId = req.query.sprintId ? parseInt(req.query.sprintId as string) : undefined;

    // Check access
    const canAccess = await canAccessTeamAnalytics(user.id, user.role, teamId);
    if (!canAccess) {
      const error = new Error('Access denied to story analytics') as ApiError;
      error.statusCode = 403;
      throw error;
    }

    const userTeamIds = await getUserTeamIds(user.id, user.role);
    const targetTeamIds = teamId ? [teamId] : userTeamIds;

    if (targetTeamIds.length === 0) {
      return res.json({
        distribution: [],
        total: 0
      });
    }

    // Build query conditions
    let queryConditions = [];
    
    if (sprintId) {
      queryConditions.push(eq(stories.sprintId, sprintId));
    } else {
      // Filter by team through releases and sprints
      const teamReleases = await db.select({ id: releases.id }).from(releases).where(or(...targetTeamIds.map(id => eq(releases.teamId, id))));
      if (teamReleases.length > 0) {
        const releaseIds = teamReleases.map(r => r.id);
        const teamSprints = await db.select({ id: sprints.id }).from(sprints).where(or(...releaseIds.map(id => eq(sprints.releaseId, id))));
        if (teamSprints.length > 0) {
          const sprintIds = teamSprints.map(s => s.id);
          queryConditions.push(or(...sprintIds.map(id => eq(stories.sprintId, id))));
        }
      }
    }

    const whereCondition = queryConditions.length > 0 ? and(...queryConditions) : undefined;

    // Get story distribution by status
    const statusDistribution = await db
      .select({
        status: stories.status,
        count: count(),
      })
      .from(stories)
      .where(whereCondition)
      .groupBy(stories.status);

    const total = statusDistribution.reduce((sum, item) => sum + item.count, 0);

    const distribution = statusDistribution.map(item => ({
      status: item.status,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    res.json({
      distribution,
      total
    });
  } catch (error) {
    next(error);
  }
});

export { router as analyticsRoutes }; 