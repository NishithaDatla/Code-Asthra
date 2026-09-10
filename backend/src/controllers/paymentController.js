import paymentService from '../services/payment.service.js';
import { updatePaymentStatusSchema } from '../validators/paymentValidator.js';

/**
 * GET /api/payments/:procurementId
 * Retrieves payment details by payment ID or procurement record ID.
 */
export async function getPayment(req, res) {
  try {
    const { procurementId } = req.params;
    const payment = await paymentService.getPaymentByIdOrProcurement(req.user, procurementId);

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

/**
 * PUT /api/payments/:id/status
 * Updates payment status following state machine rules.
 * Requires CENTRE_STAFF, CENTRE_ADMIN, or SYSTEM_ADMIN role.
 */
export async function updatePaymentStatus(req, res) {
  try {
    const { id } = req.params;

    // Validate body strictly
    const parseResult = updatePaymentStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return res.status(400).json({
        success: false,
        message: issue.message,
        errors: parseResult.error.format()
      });
    }

    const updatedPayment = await paymentService.updatePaymentStatus(req.user, id, parseResult.data);

    return res.status(200).json({
      success: true,
      data: updatedPayment,
      message: 'Payment status updated successfully.'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

export default {
  getPayment,
  updatePaymentStatus
};
