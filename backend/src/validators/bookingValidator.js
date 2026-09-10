import { z } from 'zod';

export const createBookingSchema = z
  .object({
    procurement_request_id: z.string().uuid('Invalid procurement request ID format'),
    slot_id: z.string().uuid('Invalid slot ID format')
  })
  .strict({
    message: 'Disallowed or protected field present in request payload'
  });

export const rescheduleBookingSchema = z
  .object({
    new_slot_id: z.string().uuid('Invalid new slot ID format')
  })
  .strict({
    message: 'Disallowed or protected field present in request payload'
  });
