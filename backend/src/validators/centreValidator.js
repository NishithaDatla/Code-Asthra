import { z } from 'zod';

export const listCentresQuerySchema = z
  .object({
    district: z.string().optional(),
    state: z.string().optional(),
    status: z.enum(['OPEN', 'CLOSED', 'PAUSED'], {
      errorMap: () => ({ message: 'Status must be OPEN, CLOSED, or PAUSED' })
    }).optional()
  })
  .strict({
    message: 'Disallowed query parameter present'
  });

export const availabilityQuerySchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD.')
      .optional()
  })
  .strict({
    message: 'Disallowed query parameter present'
  });
