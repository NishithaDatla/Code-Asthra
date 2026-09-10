import { Router } from 'express';
import { handleGetProfile, handleUpdateProfile } from '../controllers/farmerController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken, requireRole('FARMER'));

router.get('/profile', handleGetProfile);
router.put('/profile', handleUpdateProfile);

export default router;
