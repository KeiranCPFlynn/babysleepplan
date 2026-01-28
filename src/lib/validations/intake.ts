import { z } from 'zod'

// Step 1: Baby Selection
export const step1Schema = z.object({
  baby_id: z.string().min(1, 'Please select a baby'),
})

// Step 2: Current Sleep Situation
export const step2Schema = z.object({
  current_bedtime: z.string().optional(),
  current_waketime: z.string().optional(),
  falling_asleep_method: z.string().optional(),
})

// Step 3: Night Sleep
export const step3Schema = z.object({
  night_wakings_count: z.number().min(0).max(20).optional(),
  night_wakings_description: z.string().max(1000).optional(),
  night_waking_duration: z.string().optional(),
  night_waking_pattern: z.string().max(1000).optional(),
})

// Step 4: Naps
export const step4Schema = z.object({
  nap_count: z.number().min(0).max(10).optional(),
  nap_duration: z.string().optional(),
  nap_method: z.string().optional(),
  nap_location: z.string().optional(),
})

// Step 5: The Problem
export const step5Schema = z.object({
  problems: z.array(z.string()).optional(),
  problem_description: z.string().max(2000).optional(),
})

// Step 6: Parent Preferences
export const step6Schema = z.object({
  crying_comfort_level: z.number().min(1).max(5).optional(),
  parent_constraints: z.string().max(1000).optional(),
})

// Step 7: Goals
export const step7Schema = z.object({
  success_description: z.string().max(1000).optional(),
  additional_notes: z.string().max(2000).optional(),
})

// Complete intake schema
export const intakeSchema = z.object({
  baby_id: z.string().min(1, 'Please select a baby'),
  // Step 2
  current_bedtime: z.string().optional().nullable(),
  current_waketime: z.string().optional().nullable(),
  falling_asleep_method: z.string().optional().nullable(),
  // Step 3
  night_wakings_count: z.number().min(0).max(20).optional().nullable(),
  night_wakings_description: z.string().max(1000).optional().nullable(),
  night_waking_duration: z.string().optional().nullable(),
  night_waking_pattern: z.string().max(1000).optional().nullable(),
  // Step 4
  nap_count: z.number().min(0).max(10).optional().nullable(),
  nap_duration: z.string().optional().nullable(),
  nap_method: z.string().optional().nullable(),
  nap_location: z.string().optional().nullable(),
  // Step 5
  problems: z.array(z.string()).optional().nullable(),
  problem_description: z.string().max(2000).optional().nullable(),
  // Step 6
  crying_comfort_level: z.number().min(1).max(5).optional().nullable(),
  parent_constraints: z.string().max(1000).optional().nullable(),
  // Step 7
  success_description: z.string().max(1000).optional().nullable(),
  additional_notes: z.string().max(2000).optional().nullable(),
})

export type IntakeFormData = z.infer<typeof intakeSchema>

// Falling asleep method options
export const fallingAsleepMethods = [
  { value: 'nursing', label: 'Nursing/Bottle feeding' },
  { value: 'rocking', label: 'Rocking' },
  { value: 'holding', label: 'Being held' },
  { value: 'patting', label: 'Patting/Shushing' },
  { value: 'cosleeping', label: 'Co-sleeping' },
  { value: 'independent', label: 'Falls asleep independently' },
  { value: 'stroller', label: 'Stroller/Car' },
  { value: 'other', label: 'Other' },
]

// Night waking duration options
export const nightWakingDurations = [
  { value: 'under_15', label: 'Under 15 minutes' },
  { value: '15_30', label: '15-30 minutes' },
  { value: '30_60', label: '30-60 minutes' },
  { value: 'over_60', label: 'Over 1 hour' },
  { value: 'varies', label: 'Varies widely' },
]

// Nap duration options
export const napDurations = [
  { value: 'under_30', label: 'Under 30 minutes (cat naps)' },
  { value: '30_60', label: '30-60 minutes' },
  { value: '60_90', label: '1-1.5 hours' },
  { value: '90_120', label: '1.5-2 hours' },
  { value: 'over_120', label: 'Over 2 hours' },
  { value: 'varies', label: 'Varies widely' },
]

// Nap location options
export const napLocations = [
  { value: 'crib', label: 'Crib/Bassinet' },
  { value: 'parent_bed', label: 'Parent\'s bed' },
  { value: 'swing', label: 'Swing/Bouncer' },
  { value: 'carrier', label: 'Baby carrier/Wrap' },
  { value: 'stroller', label: 'Stroller' },
  { value: 'car', label: 'Car seat' },
  { value: 'arms', label: 'In arms' },
  { value: 'multiple', label: 'Multiple locations' },
]

// Sleep problems options
export const sleepProblems = [
  { value: 'hard_to_settle', label: 'Hard to settle at bedtime' },
  { value: 'frequent_wakings', label: 'Frequent night wakings' },
  { value: 'early_waking', label: 'Waking too early in the morning' },
  { value: 'short_naps', label: 'Short naps' },
  { value: 'nap_resistance', label: 'Resists napping' },
  { value: 'sleep_associations', label: 'Needs specific conditions to sleep' },
  { value: 'night_feeds', label: 'Still needs night feeds' },
  { value: 'schedule', label: 'Inconsistent schedule' },
  { value: 'transitions', label: 'Difficulty with sleep transitions' },
  { value: 'separation_anxiety', label: 'Separation anxiety at sleep times' },
]
