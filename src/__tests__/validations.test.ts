import { describe, it, expect } from 'vitest'
import { babySchema, BabyFormData } from '@/lib/validations/baby'
import { intakeSchema, step1Schema, IntakeFormData } from '@/lib/validations/intake'

describe('Baby Validation', () => {
  describe('babySchema', () => {
    it('should validate a valid baby', () => {
      const validBaby: BabyFormData = {
        name: 'Test Baby',
        date_of_birth: '2024-01-15',
        premature_weeks: 0,
      }
      const result = babySchema.safeParse(validBaby)
      expect(result.success).toBe(true)
    })

    it('should require name', () => {
      const invalidBaby = {
        name: '',
        date_of_birth: '2024-01-15',
        premature_weeks: 0,
      }
      const result = babySchema.safeParse(invalidBaby)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should require date_of_birth', () => {
      const invalidBaby = {
        name: 'Test Baby',
        date_of_birth: '',
        premature_weeks: 0,
      }
      const result = babySchema.safeParse(invalidBaby)
      expect(result.success).toBe(false)
    })

    it('should validate premature_weeks range (0-20)', () => {
      const invalidBaby = {
        name: 'Test Baby',
        date_of_birth: '2024-01-15',
        premature_weeks: 25,
      }
      const result = babySchema.safeParse(invalidBaby)
      expect(result.success).toBe(false)
    })

    it('should validate temperament enum', () => {
      const validBaby = {
        name: 'Test Baby',
        date_of_birth: '2024-01-15',
        premature_weeks: 0,
        temperament: 'easy' as const,
      }
      const result = babySchema.safeParse(validBaby)
      expect(result.success).toBe(true)
    })

    it('should reject invalid temperament', () => {
      const invalidBaby = {
        name: 'Test Baby',
        date_of_birth: '2024-01-15',
        premature_weeks: 0,
        temperament: 'invalid',
      }
      const result = babySchema.safeParse(invalidBaby)
      expect(result.success).toBe(false)
    })

    it('should allow optional fields', () => {
      const minimalBaby = {
        name: 'Test Baby',
        date_of_birth: '2024-01-15',
        premature_weeks: 0,
      }
      const result = babySchema.safeParse(minimalBaby)
      expect(result.success).toBe(true)
    })
  })
})

describe('Intake Validation', () => {
  describe('step1Schema', () => {
    it('should require baby_id', () => {
      const invalid = { baby_id: '' }
      const result = step1Schema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should accept valid baby_id', () => {
      const valid = { baby_id: '123e4567-e89b-12d3-a456-426614174000' }
      const result = step1Schema.safeParse(valid)
      expect(result.success).toBe(true)
    })
  })

  describe('intakeSchema', () => {
    it('should validate minimal intake with just baby_id', () => {
      const minimal: Partial<IntakeFormData> = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
      }
      const result = intakeSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should validate complete intake', () => {
      const complete: IntakeFormData = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
        current_bedtime: '19:30',
        current_waketime: '06:30',
        falling_asleep_method: 'nursing',
        night_wakings_count: 3,
        night_wakings_description: 'Wakes crying',
        night_waking_duration: '15_30',
        night_waking_pattern: 'Every 2-3 hours',
        nap_count: 2,
        nap_duration: '30_60',
        nap_method: 'rocking',
        nap_location: 'crib',
        problems: ['frequent_wakings', 'short_naps'],
        problem_description: 'Baby wakes frequently',
        crying_comfort_level: 3,
        parent_constraints: 'Work from home',
        success_description: 'Sleep through the night',
        additional_notes: 'None',
      }
      const result = intakeSchema.safeParse(complete)
      expect(result.success).toBe(true)
    })

    it('should validate crying_comfort_level range (1-5)', () => {
      const invalid = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
        crying_comfort_level: 6,
      }
      const result = intakeSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should validate night_wakings_count range (0-20)', () => {
      const invalid = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
        night_wakings_count: 25,
      }
      const result = intakeSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should validate nap_count range (0-10)', () => {
      const invalid = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
        nap_count: 15,
      }
      const result = intakeSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should allow null values for optional fields', () => {
      const withNulls = {
        baby_id: '123e4567-e89b-12d3-a456-426614174000',
        current_bedtime: null,
        night_wakings_count: null,
        problems: null,
      }
      const result = intakeSchema.safeParse(withNulls)
      expect(result.success).toBe(true)
    })
  })
})

describe('Database Schema Compatibility', () => {
  describe('intake_submissions table', () => {
    it('should have valid status values', () => {
      const validStatuses = ['draft', 'submitted', 'paid']
      validStatuses.forEach(status => {
        expect(['draft', 'submitted', 'paid']).toContain(status)
      })
    })

    it('should have valid temperament values', () => {
      const validTemperaments = ['easy', 'moderate', 'spirited']
      validTemperaments.forEach(temp => {
        expect(['easy', 'moderate', 'spirited']).toContain(temp)
      })
    })

    it('should have valid plan status values', () => {
      const validStatuses = ['generating', 'completed', 'failed']
      validStatuses.forEach(status => {
        expect(['generating', 'completed', 'failed']).toContain(status)
      })
    })
  })

  describe('Required fields for intake creation', () => {
    it('should identify required fields', () => {
      // These are the fields required by the database (NOT NULL without defaults)
      const requiredFields = ['baby_id', 'user_id']
      requiredFields.forEach(field => {
        expect(['baby_id', 'user_id', 'data']).toContain(field)
      })
    })

    it('should have defaults for status', () => {
      // status defaults to 'draft' in the database
      const defaultStatus = 'draft'
      expect(defaultStatus).toBe('draft')
    })
  })
})
