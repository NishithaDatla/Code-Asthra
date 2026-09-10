import { Router } from 'express';
import {
  handleCreateRequest,
  handleListRequests,
  handleGetRequestById
} from '../controllers/procurementRequestController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.post('/', handleCreateRequest);
router.get('/', handleListRequests);
router.get('/:id', handleGetRequestById);

export default router;
