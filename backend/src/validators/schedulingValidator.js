import { z } from 'zod';

export const recommendationRequestSchema = z
  .object({
    procurement_request_id: z.string().uuid('Invalid procurement request ID format'),
    preferred_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD.')
      .optional()
  })
  .strict({
    message: 'Disallowed or protected field present in request payload'
  });
