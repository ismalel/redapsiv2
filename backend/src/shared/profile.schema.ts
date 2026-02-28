import { z } from 'zod';

export const updatePsychologistProfileSchema = z.object({
  license_number: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().optional(),
  session_fee: z.number().optional(),
  modalities: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  years_experience: z.number().int().min(0).optional(),
  avatar_url: z.string().optional(),
});

export const setAvailabilitySchema = z.array(
  z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    type: z.enum(['AVAILABLE', 'BLOCKED']).default('AVAILABLE'),
  })
);

export const updateConsultantProfileSchema = z.object({
  birth_date: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
});

export const onboardingStepSchema = z.object({
  data: z.any(),
});
