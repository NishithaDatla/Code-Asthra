import { z } from 'zod';

export const updateFarmerProfileSchema = z
  .object({
    full_name: z.string().min(1, 'Full name cannot be empty').optional(),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
    land_size_acres: z.number().positive('Land size must be a positive number').optional().nullable(),
    address_line: z.string().optional().nullable(),
    village_or_city: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    bank_account_number: z.string().optional().nullable(),
    bank_ifsc: z.string().optional().nullable()
  })
  .strict({
    message: 'Disallowed field present in update payload'
  });
