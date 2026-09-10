import { z } from 'zod';

export const createProcurementRequestSchema = z
  .object({
    crop_id: z.string().uuid('Invalid crop ID format'),
    estimated_quantity_quintals: z
      .number({ required_error: 'Estimated quantity is required' })
      .positive('Estimated quantity must be a positive number'),
    notes: z.string().optional().nullable()
  })
  .strict({
    message: 'Disallowed or protected field present in request payload'
  });
