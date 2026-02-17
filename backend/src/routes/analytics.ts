import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// GET /api/analytics/dashboard
router.get('/dashboard', analyticsController.getDashboard);

export default router;
