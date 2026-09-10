import { z } from 'zod';

export const procurementParamSchema = z.object({
  id: z.string().uuid('Invalid procurement or booking ID format')
});

export const submitQualityCheckSchema = z
  .object({
    moisture_content_pct: z
      .number({ required_error: 'Moisture content is required' })
      .min(0, 'Moisture content cannot be negative')
      .max(100, 'Moisture content cannot exceed 100%'),
    foreign_matter_pct: z
      .number({ required_error: 'Foreign matter is required' })
      .min(0, 'Foreign matter cannot be negative')
      .max(100, 'Foreign matter cannot exceed 100%'),
    damaged_grains_pct: z
      .number({ required_error: 'Damaged grains is required' })
      .min(0, 'Damaged grains cannot be negative')
      .max(100, 'Damaged grains cannot exceed 100%'),
    remarks: z.string().optional().nullable()
  })
  .strict({
    message: 'Disallowed or protected field present in quality payload'
  });

export const submitWeighingSchema = z
  .object({
    gross_weight_quintals: z
      .number({ required_error: 'Gross weight is required' })
      .positive('Gross weight must be a positive number'),
    tare_weight_quintals: z
      .number({ required_error: 'Tare weight is required' })
      .min(0, 'Tare weight cannot be negative')
  })
  .strict({
    message: 'Disallowed or protected field present in weighing payload'
  })
  .refine((data) => data.gross_weight_quintals > data.tare_weight_quintals, {
    message: 'Gross weight must be greater than tare weight',
    path: ['gross_weight_quintals']
  });
