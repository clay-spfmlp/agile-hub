import { Router } from 'express';
import { authenticateToken, requireAdmin, requireScrumMasterOrAdmin } from '../middleware/auth';

const router: Router = Router();

// Protected route - requires any authenticated user
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'This is a protected route',
    user: req.user,
  });
});

// Admin-only route
router.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'This route is only accessible by admins',
    user: req.user,
  });
});

// Scrum Master or Admin route
router.get('/scrum-master', authenticateToken, requireScrumMasterOrAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'This route is accessible by Scrum Masters and Admins',
    user: req.user,
  });
});

export { router as protectedRoutes }; 