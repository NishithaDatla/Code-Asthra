import { z } from 'zod';

/**
 * Validator schema for Payment Status Updates (PUT /api/payments/:id/status)
 * Strictly allows only target status and optional transaction_id.
 * Rejects all client attempts to mutate server-controlled fields (amount, farmer_id, payment_reference, etc.)
 */
export const updatePaymentStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED'], {
    required_error: 'Payment status is required',
    invalid_type_error: 'Invalid payment status'
  }),
  transaction_id: z.string().trim().max(100, 'Transaction ID must not exceed 100 characters').optional().nullable()
}).strict({
  message: 'Extra fields are not allowed in payment status update'
});

export default {
  updatePaymentStatusSchema
};
