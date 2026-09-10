import { Router } from 'express';
import { handleRegister, handleLogin, handleLogout, handleMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, handleRegister);
router.post('/login', authLimiter, handleLogin);
router.post('/logout', authenticateToken, handleLogout);
router.get('/me', authenticateToken, handleMe);

export default router;
