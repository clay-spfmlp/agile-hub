import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { Server as SocketIOServer } from 'socket.io';

// In-memory storage for sessions (replace with database in production)
export const sessions: Record<string, any> = {};

// Validation schemas
const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  description: z.string().optional(),
  teamId: z.number().optional(),
  sprintId: z.number().optional(),
  votingScale: z.enum(['fibonacci', 'tshirt', 'power-of-2', 'modified-fibonacci']).optional(),
  timerDuration: z.number().optional(),
  autoReveal: z.boolean().optional(),
  allowRevoting: z.boolean().optional(),
});

export function planningRoutes(io: SocketIOServer) {
  const router: Router = Router();

  // POST /api/planning/sessions - Create a new planning session
  router.post('/sessions', authenticateToken, async (req, res, next) => {
    try {
      const user = (req as any).user;
      const validatedData = createSessionSchema.parse(req.body);
      
      // Generate room code (6 characters)
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Create session
      const session = {
        id: randomUUID(),
        roomCode,
        name: validatedData.name,
        description: validatedData.description,
        createdById: user.id,
        teamId: validatedData.teamId,
        sprintId: validatedData.sprintId,
        status: 'ACTIVE',
        state: 'waiting',
        settings: {
          votingScale: validatedData.votingScale || 'fibonacci',
          timerDuration: validatedData.timerDuration || 0,
          autoReveal: validatedData.autoReveal || true,
          allowRevoting: validatedData.allowRevoting || true,
        },
        participants: [],
        stories: [],
        votes: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      };
      
      // Store session
      sessions[roomCode] = session;
      
      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/planning/sessions/:roomCode - Get session by room code (no auth required)
  router.get('/sessions/:roomCode', async (req, res, next) => {
    try {
      const { roomCode } = req.params;
      
      const session = sessions[roomCode.toUpperCase()];
      
      if (!session) {
        const error = new Error('Session not found') as ApiError;
        error.statusCode = 404;
        throw error;
      }
      
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/planning/sessions - Get session by room code (query param)
  router.get('/sessions', async (req, res, next) => {
    try {
      const { roomCode } = req.query;
      
      // Debug logging
      console.log('Looking for session with roomCode:', roomCode);
      console.log('Available sessions:', Object.keys(sessions));
      console.log('Sessions data:', sessions);
      
      if (!roomCode) {
        const error = new Error('Room code is required') as ApiError;
        error.statusCode = 400;
        throw error;
      }
      
      const session = sessions[String(roomCode).toUpperCase()];
      
      if (!session) {
        console.log(`Session not found for roomCode: ${roomCode}`);
        const error = new Error('Session not found') as ApiError;
        error.statusCode = 404;
        throw error;
      }
      
      res.json(session);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/planning/sessions/:roomCode/join - Join a session (for guests)
  router.post('/sessions/:roomCode/join', async (req, res, next) => {
    try {
      const { roomCode } = req.params;
      const { name } = req.body;
      
      if (!name) {
        const error = new Error('Name is required') as ApiError;
        error.statusCode = 400;
        throw error;
      }
      
      const session = sessions[roomCode.toUpperCase()];
      
      if (!session) {
        const error = new Error('Session not found') as ApiError;
        error.statusCode = 404;
        throw error;
      }
      
      // Add participant to session
      const participant = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: name.trim(),
        isGuest: true,
        isOnline: false, // Will be set to true when they connect via WebSocket
        joinedAt: new Date(),
        socketId: null
      };
      
      session.participants.push(participant);
      session.updatedAt = new Date();

      // Emit WebSocket event to notify other participants
      console.log(`Emitting participant_joined event to room ${roomCode.toUpperCase()} for new HTTP join: ${participant.name}`);
      io.to(roomCode.toUpperCase()).emit('planning:participant_joined', {
        participant,
        session: {
          ...session,
          participantCount: session.participants.length
        }
      });
      
      res.json({
        session: {
          ...session,
          participantCount: session.participants.length
        },
        participant
      });
    } catch (error) {
      next(error);
    }
  });

  // Debug endpoint to list all sessions
  router.get('/sessions/debug/all', async (req, res) => {
    res.json({
      sessionCount: Object.keys(sessions).length,
      sessions: Object.keys(sessions),
      fullSessions: sessions
    });
  });

  // Debug endpoint to create a test session (development only)
  router.post('/sessions/debug/create', async (req, res) => {
    try {
      const roomCode = 'TEST01';
      
      const session = {
        id: randomUUID(),
        roomCode,
        name: 'Debug Test Session',
        description: 'Test session for development',
        createdById: 'debug-user',
        teamId: null,
        sprintId: null,
        status: 'ACTIVE',
        state: 'waiting',
        settings: {
          votingScale: 'fibonacci',
          timerDuration: 0,
          autoReveal: true,
          allowRevoting: true,
        },
        participants: [],
        stories: [],
        votes: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
      };
      
      sessions[roomCode] = session;
      
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  return router;
}
