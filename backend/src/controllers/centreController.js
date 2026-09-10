import { listCentresQuerySchema, availabilityQuerySchema } from '../validators/centreValidator.js';
import {
  getCentres,
  getCentreById,
  getCentreAvailability
} from '../services/centreService.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function handleListCentres(req, res) {
  try {
    const parseResult = listCentresQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const centres = await getCentres(parseResult.data);
    return res.status(200).json({
      success: true,
      data: centres
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve procurement centres.'
    });
  }
}

export async function handleGetCentreById(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centre ID format.'
      });
    }

    const centre = await getCentreById(id);
    if (!centre) {
      return res.status(404).json({
        success: false,
        message: 'Procurement centre not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: centre
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve procurement centre.'
    });
  }
}

export async function handleGetCentreAvailability(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centre ID format.'
      });
    }

    const parseResult = availabilityQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD.',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const targetDate = parseResult.data.date || new Date().toISOString().split('T')[0];

    const availability = await getCentreAvailability(id, targetDate);
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Procurement centre not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: availability
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve centre availability.'
    });
  }
}
