import { Router } from 'express';
import {
  handleTriggerNotification,
  handleGetUserNotifications,
  handleMarkNotificationAsRead
} from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce Bearer token authentication
router.use(authenticateToken);

router.post('/trigger', handleTriggerNotification);
router.get('/', handleGetUserNotifications);
router.put('/:id/read', handleMarkNotificationAsRead);

export default router;
