import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    full_name: z.string().min(1, 'Full name is required'),
    phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),

    // Optional Farmer Profile Fields
    land_size_acres: z.number().positive().optional().nullable(),
    address_line: z.string().optional().nullable(),
    village_or_city: z.string().optional().nullable(),
    district: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    bank_account_number: z.string().optional().nullable(),
    bank_ifsc: z.string().optional().nullable()
  })
  .strict({
    message: 'Disallowed or protected field present in registration payload'
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
