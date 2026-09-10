import { Router } from 'express';
import {
  handleGetProcurementRecord,
  handleSubmitQualityCheck,
  handleSubmitWeighing,
  handleCompleteProcurement
} from '../controllers/procurementController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import { sensitiveWriteLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Enforce Bearer token authentication for all procurement routes
router.use(authenticateToken);

// Read-only procurement details lookup (Farmers, Staff, Admins)
router.get(
  '/:id',
  requireRole('FARMER', 'CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  handleGetProcurementRecord
);

// Quality inspection submission (Centre Staff, Centre Admin, System Admin ONLY)
router.post(
  '/:id/quality',
  requireRole('CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  sensitiveWriteLimiter,
  handleSubmitQualityCheck
);

// Digital scale weighing submission (Centre Staff, Centre Admin, System Admin ONLY)
router.post(
  '/:id/weigh',
  requireRole('CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  sensitiveWriteLimiter,
  handleSubmitWeighing
);

// Atomic procurement completion & payment initialization (Centre Staff, Centre Admin, System Admin ONLY)
router.post(
  '/:id/complete',
  requireRole('CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  sensitiveWriteLimiter,
  handleCompleteProcurement
);

export default router;
