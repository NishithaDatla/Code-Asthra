import { Router } from 'express';
import {
  handleListCentres,
  handleGetCentreById,
  handleGetCentreAvailability
} from '../controllers/centreController.js';
import {
  handleGetCentreCapacity,
  handleGetCentreCongestion,
  handleGetCentreBottlenecks,
  handleGetCentreWorkload,
  handleGetCentreDisruptions,
  handleGetCentreAnalytics,
  handleGetCentreRecommendedSlots
} from '../controllers/centreMetricsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// Existing Developer 1 routes
router.get('/', handleListCentres);
router.get('/:id', handleGetCentreById);
router.get('/:id/availability', handleGetCentreAvailability);

// Developer 2 Phase 2 Operational Metrics & Analytics (Read-Only)
router.get('/:id/capacity', handleGetCentreCapacity);
router.get('/:id/congestion', handleGetCentreCongestion);
router.get('/:id/bottlenecks', handleGetCentreBottlenecks);
router.get('/:id/workload', handleGetCentreWorkload);
router.get('/:id/disruptions', handleGetCentreDisruptions);
router.get('/:id/analytics', handleGetCentreAnalytics);
router.get('/:id/recommended-slots', handleGetCentreRecommendedSlots);

export default router;
