import { Router } from 'express';
import { handleRegister, handleLogin, handleLogout, handleMe, handleSendOtp, handleVerifyOtp } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, handleRegister);
router.post('/login', authLimiter, handleLogin);
router.post('/send-otp', otpLimiter, handleSendOtp);
router.post('/verify-otp', authLimiter, handleVerifyOtp);
router.post('/logout', authenticateToken, handleLogout);
router.get('/me', authenticateToken, handleMe);

export default router;
