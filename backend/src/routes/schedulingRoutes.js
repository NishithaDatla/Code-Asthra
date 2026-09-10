import { Router } from 'express';
import { handleRecommendSlots } from '../controllers/schedulingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/recommend', handleRecommendSlots);

export default router;
