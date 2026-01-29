import { z } from 'zod'

export const babySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  premature_weeks: z.number().min(0).max(20),
  medical_conditions: z.string().max(1000, 'Text is too long').optional(),
  temperament: z.enum([
    'easy',
    'moderate',
    'spirited',
    'sensitive',
    'adaptable',
    'slow_to_warm',
    'persistent',
    'not_sure',
    'other',
  ]).optional(),
  temperament_notes: z.string().max(1000, 'Text is too long').optional(),
})

export type BabyFormData = z.infer<typeof babySchema>
