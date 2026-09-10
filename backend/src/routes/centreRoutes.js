import { Router } from 'express';
import {
  handleListCentres,
  handleGetCentreById,
  handleGetCentreAvailability
} from '../controllers/centreController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', handleListCentres);
router.get('/:id', handleGetCentreById);
router.get('/:id/availability', handleGetCentreAvailability);

export default router;
