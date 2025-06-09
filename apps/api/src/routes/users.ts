import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@repo/database';
import { users, teams, teamMembers, teamScrumMasters, votes } from '@repo/database';
import { eq, inArray } from 'drizzle-orm';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Available roles configuration
const VALID_ROLES = ['USER', 'SCRUM_MASTER', 'ADMIN', 'SUPER_ADMIN'] as const;
type ValidRole = typeof VALID_ROLES[number];

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
  }),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  teamIds: z.array(z.number()).optional(),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  role: z.enum(VALID_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${VALID_ROLES.join(', ')}` })
  }).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  teamIds: z.array(z.number()).optional(),
});

// GET /api/users - Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users)
      .orderBy(users.createdAt);

    // Get team relationships for all users
    const usersWithTeams = await Promise.all(
      allUsers.map(async (user) => {
        // Get teams where user is Scrum Master
        const managedTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
          })
          .from(teams)
          .where(eq(teams.scrumMasterId, user.id));

        // Get teams where user is a member
        const memberTeams = await db
          .select({
            id: teams.id,
            name: teams.name,
          })
          .from(teamMembers)
          .innerJoin(teams, eq(teamMembers.teamId, teams.id))
          .where(eq(teamMembers.userId, user.id));

        // Combine and deduplicate teams (a user could be both SM and member)
        const allUserTeams = [...managedTeams, ...memberTeams];
        const uniqueTeams = allUserTeams.filter((team, index, self) => 
          index === self.findIndex((t) => t.id === team.id)
        );

        return {
          ...user,
          managedTeams,
          memberTeams,
          allTeams: uniqueTeams
        };
      })
    );

    res.json(usersWithTeams);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      const error = new Error('Invalid user ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    const user = userResult[0];
    res.json({
      ...user,
      managedTeams: [] // Placeholder until teams are implemented
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      const error = new Error('Email already exists') as ApiError;
      error.statusCode = 409;
      throw error;
    }

    // Generate default password if not provided
    const password = validatedData.password || 'ChangeMe123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUserResult = await db
      .insert(users)
      .values({
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        password: hashedPassword,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      });

    const newUser = newUserResult[0];

    // Handle team assignments if provided
    if (validatedData.teamIds && validatedData.teamIds.length > 0) {
      // Verify all team IDs exist
      const existingTeams = await db
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.id, validatedData.teamIds));

      if (existingTeams.length !== validatedData.teamIds.length) {
        const error = new Error('One or more team IDs are invalid') as ApiError;
        error.statusCode = 400;
        throw error;
      }

      // Add user to teams
      const teamMemberInserts = validatedData.teamIds.map(teamId => ({
        userId: newUser.id,
        teamId: teamId,
      }));

      await db.insert(teamMembers).values(teamMemberInserts);
    }

    // Get updated team relationships
    const managedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .where(eq(teams.scrumMasterId, newUser.id));

    const memberTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, newUser.id));

    const allUserTeams = [...managedTeams, ...memberTeams];
    const uniqueTeams = allUserTeams.filter((team, index, self) => 
      index === self.findIndex((t) => t.id === team.id)
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        ...newUser,
        managedTeams,
        memberTeams,
        allTeams: uniqueTeams
      },
      defaultPassword: validatedData.password ? undefined : password
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      const error = new Error('Invalid user ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Check if email is being changed and if it already exists
    if (validatedData.email && validatedData.email !== existingUser[0].email) {
      const emailCheck = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (emailCheck.length > 0) {
        const error = new Error('Email already exists') as ApiError;
        error.statusCode = 409;
        throw error;
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.role) updateData.role = validatedData.role;
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Check if there's anything to update (user fields or team assignments)
    if (Object.keys(updateData).length === 0 && validatedData.teamIds === undefined) {
      const error = new Error('No valid fields provided for update') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    let updatedUser;

    // Update user if there are user fields to update
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();

      const updatedUserResult = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        });

      updatedUser = updatedUserResult[0];
    } else {
      // If only updating teams, get current user data
      const currentUserResult = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      updatedUser = currentUserResult[0];
    }

    // Handle team assignments if provided
    if (validatedData.teamIds !== undefined) {
      // Remove existing team memberships
      await db
        .delete(teamMembers)
        .where(eq(teamMembers.userId, userId));

      // Add new team memberships if any
      if (validatedData.teamIds.length > 0) {
        // Verify all team IDs exist
        const existingTeams = await db
          .select({ id: teams.id })
          .from(teams)
          .where(inArray(teams.id, validatedData.teamIds));

        if (existingTeams.length !== validatedData.teamIds.length) {
          const error = new Error('One or more team IDs are invalid') as ApiError;
          error.statusCode = 400;
          throw error;
        }

        // Add user to teams
        const teamMemberInserts = validatedData.teamIds.map(teamId => ({
          userId: userId,
          teamId: teamId,
        }));

        await db.insert(teamMembers).values(teamMemberInserts);
      }
    }

    // Get updated team relationships
    const managedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .where(eq(teams.scrumMasterId, userId));

    const memberTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, userId));

    const allUserTeams = [...managedTeams, ...memberTeams];
    const uniqueTeams = allUserTeams.filter((team, index, self) => 
      index === self.findIndex((t) => t.id === team.id)
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...updatedUser,
        managedTeams,
        memberTeams,
        allTeams: uniqueTeams
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user with cascading cleanup (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      const error = new Error('Invalid user ID') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Prevent deleting yourself
    if (req.user && req.user.id === userId) {
      const error = new Error('Cannot delete your own account') as ApiError;
      error.statusCode = 400;
      throw error;
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      const error = new Error('User not found') as ApiError;
      error.statusCode = 404;
      throw error;
    }

    // Cascading delete with cleanup - use transaction for data integrity
    await db.transaction(async (tx) => {
      // 1. Remove from team memberships
      await tx
        .delete(teamMembers)
        .where(eq(teamMembers.userId, userId));

      // 2. Remove from Scrum Master roles
      await tx
        .delete(teamScrumMasters)
        .where(eq(teamScrumMasters.userId, userId));

      // 3. Update teams where user is Scrum Master (set to null)
      await tx
        .update(teams)
        .set({ scrumMasterId: null })
        .where(eq(teams.scrumMasterId, userId));

      // 4. Delete user votes
      await tx
        .delete(votes)
        .where(eq(votes.userId, userId));

      // 5. Finally delete the user
      await tx
        .delete(users)
        .where(eq(users.id, userId));
    });

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as usersRoutes }; 