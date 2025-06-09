import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '@repo/database';
import { users } from '@repo/database';
import { eq } from 'drizzle-orm';
import { ApiError } from '../middleware/errorHandler';

const router: Router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Helper function to generate JWT token
const generateToken = (userId: number, email: string, role: string): string => {
  const payload = { userId, email, role };
  // @ts-ignore - JWT types issue, but this works correctly
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Helper function to verify JWT token
const verifyToken = (token: string): { userId: number; email: string; role: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);

    // Find user in database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      const error = new Error('Invalid email or password') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    const user = userResult[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password') as ApiError;
      error.statusCode = 401;
      throw error;
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email, user.role);

    // Return success response with JWT token
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user from JWT token
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ user: null });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.json({ user: null });
    }

    // Fetch current user data from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.json({ user: null });
    }

    const user = userResult[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Logout user (client-side token removal)
router.post('/logout', (req, res) => {
  // Since JWT is stateless, logout is handled client-side by removing the token
  // In a production app, you might want to maintain a blacklist of tokens
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// GET /api/auth/test - Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is working!',
    timestamp: new Date().toISOString(),
  });
});

export { router as authRoutes }; 