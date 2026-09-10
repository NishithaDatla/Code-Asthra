import {
  procurementParamSchema,
  submitQualityCheckSchema,
  submitWeighingSchema
} from '../validators/procurementValidator.js';
import procurementService from '../services/procurement.service.js';

export async function handleGetProcurementRecord(req, res) {
  try {
    const paramResult = procurementParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procurement or booking ID format.',
        errors: paramResult.error.flatten().fieldErrors
      });
    }

    const record = await procurementService.getProcurementRecord(req.user, paramResult.data.id);
    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to retrieve procurement record.'
    });
  }
}

export async function handleSubmitQualityCheck(req, res) {
  try {
    const paramResult = procurementParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procurement or booking ID format.',
        errors: paramResult.error.flatten().fieldErrors
      });
    }

    const bodyResult = submitQualityCheckSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: bodyResult.error.flatten().fieldErrors
      });
    }

    const result = await procurementService.submitQualityCheck(
      req.user,
      paramResult.data.id,
      bodyResult.data
    );

    return res.status(201).json({
      success: true,
      message: 'Quality check submitted successfully.',
      data: result
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Quality check submission failed.'
    });
  }
}

export async function handleSubmitWeighing(req, res) {
  try {
    const paramResult = procurementParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procurement or booking ID format.',
        errors: paramResult.error.flatten().fieldErrors
      });
    }

    const bodyResult = submitWeighingSchema.safeParse(req.body);
    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: bodyResult.error.flatten().fieldErrors
      });
    }

    const result = await procurementService.submitWeighing(
      req.user,
      paramResult.data.id,
      bodyResult.data
    );

    return res.status(200).json({
      success: true,
      message: 'Weighing details recorded successfully.',
      data: result
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Weighing submission failed.'
    });
  }
}

export async function handleCompleteProcurement(req, res) {
  try {
    const paramResult = procurementParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid procurement or booking ID format.',
        errors: paramResult.error.flatten().fieldErrors
      });
    }

    const result = await procurementService.completeProcurement(
      req.user,
      paramResult.data.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: 'Procurement batch completed successfully.',
      data: result
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message.includes('not found') ? 404 : 400);
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Procurement completion failed.'
    });
  }
}

export default {
  handleGetProcurementRecord,
  handleSubmitQualityCheck,
  handleSubmitWeighing,
  handleCompleteProcurement
};
