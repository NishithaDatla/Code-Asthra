import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import paymentController from '../controllers/paymentController.js';

const router = express.Router();

// GET /api/payments/:procurementId
// Accessible by FARMER (own payment only), CENTRE_STAFF, CENTRE_ADMIN, SYSTEM_ADMIN
router.get(
  '/:procurementId',
  authenticateToken,
  requireRole('FARMER', 'CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  paymentController.getPayment
);

// PUT /api/payments/:id/status
// Accessible by CENTRE_STAFF, CENTRE_ADMIN, SYSTEM_ADMIN (Farmers receive 403)
router.put(
  '/:id/status',
  authenticateToken,
  requireRole('CENTRE_STAFF', 'CENTRE_ADMIN', 'SYSTEM_ADMIN'),
  paymentController.updatePaymentStatus
);

export default router;
