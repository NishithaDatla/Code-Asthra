import { createProcurementRequestSchema } from '../validators/procurementRequestValidator.js';
import {
  createProcurementRequest,
  getFarmerProcurementRequests,
  getFarmerProcurementRequestById
} from '../services/procurementRequestService.js';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function handleCreateRequest(req, res) {
  try {
    const parseResult = createProcurementRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
    }

    const requestData = await createProcurementRequest(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      data: requestData
    });
  } catch (err) {
    const message = err.message || 'Failed to create procurement request.';
    if (
      message.includes('not authorized') ||
      message.includes('Farmer profile not found')
    ) {
      return res.status(403).json({
        success: false,
        message
      });
    }
    if (
      message.includes('crop does not exist') ||
      message.includes('crop is currently inactive')
    ) {
      return res.status(400).json({
        success: false,
        message
      });
    }
    return res.status(400).json({
      success: false,
      message
    });
  }
}

export async function handleListRequests(req, res) {
  try {
    const requests = await getFarmerProcurementRequests(req.user.id);
    return res.status(200).json({
      success: true,
      data: requests
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve procurement requests.'
    });
  }
}

export async function handleGetRequestById(req, res) {
  try {
    const { id } = req.params;
    if (!id || !UUID_REGEX.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procurement request ID format.'
      });
    }

    const requestData = await getFarmerProcurementRequestById(req.user.id, id);
    if (!requestData) {
      return res.status(404).json({
        success: false,
        message: 'Procurement request not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: requestData
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve procurement request.'
    });
  }
}
