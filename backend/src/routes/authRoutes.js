import { Router } from 'express';
import { handleRegister, handleLogin, handleLogout, handleMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', handleRegister);
router.post('/login', handleLogin);
router.post('/logout', authenticateToken, handleLogout);
router.get('/me', authenticateToken, handleMe);

export default router;
