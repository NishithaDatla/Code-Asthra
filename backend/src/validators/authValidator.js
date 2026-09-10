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

export const sendOtpSchema = z
  .object({
    phone: z.string().min(1, 'Phone number is required')
  })
  .strict({
    message: 'Disallowed or protected field present in send-otp payload'
  });

export const verifyOtpSchema = z
  .object({
    phone: z.string().min(1, 'Phone number is required'),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 numeric digits')
  })
  .strict({
    message: 'Disallowed or protected field present in verify-otp payload'
  });

/**
 * Normalizes Indian mobile phone numbers to canonical E.164 format (+91XXXXXXXXXX).
 * Throws validation error if input contains non-digits, malformed lengths, or invalid country code.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') {
    throw new Error('Invalid phone number format.');
  }
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');

  if (/^[6-9]\d{9}$/.test(cleaned)) {
    cleaned = `+91${cleaned}`;
  }

  if (!/^\+91[6-9]\d{9}$/.test(cleaned)) {
    throw new Error('Invalid Indian mobile phone number format. Must be a valid 10-digit number or E.164 +91XXXXXXXXXX.');
  }

  return cleaned;
}
