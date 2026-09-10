import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  handleCreateBooking,
  handleRescheduleBooking,
  handleCancelBooking
} from '../controllers/bookingController.js';

const router = express.Router();

// All Phase 5F booking routes require authentication
router.use(authenticateToken);

// Approved Phase 5F Endpoints
router.post('/', handleCreateBooking);
router.put('/:id/reschedule', handleRescheduleBooking);
router.delete('/:id', handleCancelBooking);

export default router;
