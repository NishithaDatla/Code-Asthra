import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// Enforce authentication & SYSTEM_ADMIN role on all admin routes
router.use(authenticateToken);
router.use(requireRole('SYSTEM_ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', adminController.getDashboard);

// GET /api/admin/centres
router.get('/centres', adminController.getCentres);

// GET /api/admin/analytics
router.get('/analytics', adminController.getAnalytics);

// GET /api/admin/congestion
router.get('/congestion', adminController.getCongestion);

export default router;
