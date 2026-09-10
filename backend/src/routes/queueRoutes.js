import { Router } from 'express';
import {
  handleCheckInPRD,
  handleCheckIn,
  handleGetQueueByBookingId,
  handleCallNext,
  handleStartService,
  handleCompleteService,
  handleUpdateQueueStatus,
  handleGetQueuePosition,
  handleGetTokenETA,
  handleGetQueueEvents
} from '../controllers/queueController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { sensitiveWriteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Enforce Bearer token authentication
router.use(authenticateToken);

// ----------------------------------------------------------------------------
// REQUIRED PRD QUEUE ENDPOINTS
// ----------------------------------------------------------------------------
// 1. POST /api/queue/:bookingId/check-in (Check-in by booking ID)
router.post('/:bookingId/check-in', sensitiveWriteLimiter, handleCheckInPRD);

// 2. POST /api/queue/call-next (Call next WAITING farmer for centre)
router.post('/call-next', sensitiveWriteLimiter, handleCallNext);

// 3. POST /api/queue/:id/start (Transition queue entry to IN_SERVICE)
router.post('/:id/start', sensitiveWriteLimiter, handleStartService);

// 4. POST /api/queue/:id/complete (Transition queue entry to COMPLETED)
router.post('/:id/complete', sensitiveWriteLimiter, handleCompleteService);

// ----------------------------------------------------------------------------
// LEGACY ROUTE ALIASES & AUXILIARY LOOKUPS
// ----------------------------------------------------------------------------
router.post('/check-in', sensitiveWriteLimiter, handleCheckIn);
router.patch('/:id/status', sensitiveWriteLimiter, handleUpdateQueueStatus);
router.get('/:id/position', handleGetQueuePosition);
router.get('/:id/eta', handleGetTokenETA);
router.get('/:id/events', handleGetQueueEvents);

// 5. GET /api/queue/:bookingId (GET queue details by booking ID)
router.get('/:bookingId', handleGetQueueByBookingId);

export default router;

