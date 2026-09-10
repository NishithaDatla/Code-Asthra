import capacityService from '../services/capacity.service.js';
import congestionService from '../services/congestion.service.js';
import bottleneckService from '../services/bottleneck.service.js';
import workloadService from '../services/workload.service.js';
import disruptionService from '../services/disruption.service.js';
import analyticsService from '../services/analytics.service.js';
import schedulingService from '../services/scheduling.service.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Retrieves effective capacity metrics for a procurement centre.
 */
export async function handleGetCentreCapacity(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const metrics = await capacityService.getCentreEffectiveCapacity(id);
    return res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to retrieve effective capacity.' });
  }
}

/**
 * Retrieves real-time congestion metrics for a procurement centre.
 */
export async function handleGetCentreCongestion(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const metrics = await congestionService.getCentreCongestion(id);
    return res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to retrieve congestion metrics.' });
  }
}

/**
 * Retrieves evidence-based bottleneck analysis for a procurement centre.
 */
export async function handleGetCentreBottlenecks(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const report = await bottleneckService.getCentreBottlenecks(id);
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to analyze centre bottlenecks.' });
  }
}

/**
 * Retrieves multi-dimensional workload analysis for a procurement centre.
 */
export async function handleGetCentreWorkload(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const { date } = req.query;
    const report = await workloadService.getCentreWorkload(id, { date });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to analyze centre workload.' });
  }
}

/**
 * Retrieves active operational disruptions and recommended actions for a procurement centre.
 */
export async function handleGetCentreDisruptions(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const report = await disruptionService.getCentreDisruptions(id);
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to analyze centre disruptions.' });
  }
}

/**
 * Retrieves comprehensive 5-section operational analytics report for a procurement centre.
 */
export async function handleGetCentreAnalytics(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const { date } = req.query;
    const report = await analyticsService.getCentreAnalytics(id, { date });
    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to generate centre analytics.' });
  }
}

/**
 * Retrieves recommended procurement slots for a centre.
 */
export async function handleGetCentreRecommendedSlots(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid centre ID format.' });
    }

    const { date, requestedQuantityQuintals } = req.query;
    const recommendation = await schedulingService.getRecommendedSlots(id, {
      date,
      requestedQuantityQuintals
    });

    return res.status(200).json({ success: true, data: recommendation });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({ success: false, message: err.message || 'Failed to recommend slots.' });
  }
}

export default {
  handleGetCentreCapacity,
  handleGetCentreCongestion,
  handleGetCentreBottlenecks,
  handleGetCentreWorkload,
  handleGetCentreDisruptions,
  handleGetCentreAnalytics,
  handleGetCentreRecommendedSlots
};
