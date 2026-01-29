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
  additional_sleep_times: z.array(
    z.object({
      bedtime: z.string().optional(),
      waketime: z.string().optional(),
    })
  ).optional(),
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
  additional_sleep_times: z.array(
    z.object({
      bedtime: z.string().optional(),
      waketime: z.string().optional(),
    })
  ).optional().nullable(),
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
  // Additional data storage
  data: z.record(z.unknown()).optional().nullable(),
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
]

// Night waking duration options
export const nightWakingDurations = [
  { value: 'under_5', label: 'Under 5 minutes (quick resettle)' },
  { value: '5_10', label: '5-10 minutes' },
  { value: '10_15', label: '10-15 minutes' },
  { value: '15_30', label: '15-30 minutes' },
  { value: '30_45', label: '30-45 minutes' },
  { value: '45_60', label: '45-60 minutes' },
  { value: '60_90', label: '1-1.5 hours' },
  { value: 'over_90', label: 'Over 1.5 hours' },
  { value: 'varies', label: 'Varies widely (sometimes quick, sometimes long)' },
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

// Sleep problems options with descriptions
export const sleepProblems = [
  {
    value: 'hard_to_settle',
    label: 'Hard to settle at bedtime',
    description: 'Takes a long time to fall asleep, fights bedtime, cries or protests'
  },
  {
    value: 'frequent_wakings',
    label: 'Frequent night wakings',
    description: 'Wakes up multiple times during the night needing help to resettle'
  },
  {
    value: 'early_waking',
    label: 'Waking too early in the morning',
    description: 'Consistently wakes before 6am ready to start the day'
  },
  {
    value: 'short_naps',
    label: 'Short naps',
    description: 'Naps are consistently under 45 minutes (cat naps)'
  },
  {
    value: 'nap_resistance',
    label: 'Resists napping',
    description: 'Fights naps, hard to get down for daytime sleep, skips naps'
  },
  {
    value: 'sleep_associations',
    label: 'Needs specific conditions to sleep',
    description: 'Can only fall asleep with feeding, rocking, holding, or other specific help'
  },
  {
    value: 'night_feeds',
    label: 'Still needs night feeds',
    description: 'Wakes to feed during the night (may or may not be developmentally appropriate)'
  },
  {
    value: 'schedule',
    label: 'Inconsistent schedule',
    description: 'No predictable routine, sleep times vary day to day'
  },
  {
    value: 'transitions',
    label: 'Difficulty with sleep cycle transitions',
    description: 'Wakes fully between sleep cycles (every 30-45 min) instead of connecting them'
  },
  {
    value: 'separation_anxiety',
    label: 'Separation anxiety at sleep times',
    description: 'Cries or panics when parent leaves the room, needs presence to sleep'
  },
]
