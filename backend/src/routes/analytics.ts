import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/matrix', analyticsController.getMatrixAnalytics);
router.get('/trends', analyticsController.getTrendsAnalytics);
router.get('/writing', analyticsController.getWritingAnalytics);
router.get('/diary', analyticsController.getDiaryAnalytics);

export default router;
