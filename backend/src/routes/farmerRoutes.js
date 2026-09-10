import { Router } from 'express';
import { handleGetProfile, handleUpdateProfile } from '../controllers/farmerController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/profile', authenticateToken, handleGetProfile);
router.put('/profile', authenticateToken, handleUpdateProfile);

export default router;
