import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { sensitiveWriteLimiter } from '../middleware/rateLimiter.js';
import {
  handleCreateBooking,
  handleRescheduleBooking,
  handleCancelBooking
} from '../controllers/bookingController.js';

const router = express.Router();

// All Phase 5F booking routes require authentication and FARMER role
router.use(authenticateToken, requireRole('FARMER'));

// Approved Phase 5F Endpoints
router.post('/', sensitiveWriteLimiter, handleCreateBooking);
router.put('/:id/reschedule', sensitiveWriteLimiter, handleRescheduleBooking);
router.delete('/:id', sensitiveWriteLimiter, handleCancelBooking);

export default router;
