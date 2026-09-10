import { Router } from 'express';
import {
  handleTriggerNotification,
  handleGetUserNotifications
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce Bearer token authentication
router.use(authenticateToken);

router.post('/trigger', handleTriggerNotification);
router.get('/', handleGetUserNotifications);

export default router;
