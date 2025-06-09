import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@repo/database';
import { users } from '@repo/database';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

// Middleware to verify JWT token and attach user to request
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string; role: string };
    
    // Fetch current user data from database
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    const user = userResult[0];
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user has specific role
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: `Access denied. ${requiredRole} role required.` });
    }

    next();
  };
};

// Middleware to check if user has admin role
export const requireAdmin = requireRole('ADMIN');

// Middleware to check if user has scrum master or admin role
export const requireScrumMasterOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'SCRUM_MASTER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Scrum Master or Admin role required.' });
  }

  next();
}; 