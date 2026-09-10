import { Router } from 'express';
import { handleRecommendSlots } from '../controllers/schedulingController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken, requireRole('FARMER'));

router.post('/recommend', handleRecommendSlots);

export default router;
