import { Router } from 'express';
import {
  handleCheckIn,
  handleUpdateQueueStatus,
  handleGetQueuePosition,
  handleGetTokenETA,
  handleGetQueueEvents
} from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce Bearer token authentication
router.use(authenticateToken);

// Queue Mutations (Atomic RPC transactions)
router.post('/check-in', handleCheckIn);
router.patch('/:id/status', handleUpdateQueueStatus);

// Read-only Queue Lookups
router.get('/:id/position', handleGetQueuePosition);
router.get('/:id/eta', handleGetTokenETA);
router.get('/:id/events', handleGetQueueEvents);

export default router;
