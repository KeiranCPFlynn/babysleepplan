import { describe, it, expect } from 'vitest'
import { babySchema } from '@/lib/validations/baby'
import {
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
  intakeSchema,
} from '@/lib/validations/intake'

describe('babySchema extended', () => {
  const validBaby = {
    name: 'Luna',
    date_of_birth: '2025-01-15',
    premature_weeks: 0,
  }

  it('accepts name at max length (100 chars)', () => {
    const result = babySchema.safeParse({ ...validBaby, name: 'a'.repeat(100) })
    expect(result.success).toBe(true)
  })

  it('rejects name exceeding 100 chars', () => {
    const result = babySchema.safeParse({ ...validBaby, name: 'a'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts premature_weeks at boundary 0', () => {
    const result = babySchema.safeParse({ ...validBaby, premature_weeks: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts premature_weeks at boundary 20', () => {
    const result = babySchema.safeParse({ ...validBaby, premature_weeks: 20 })
    expect(result.success).toBe(true)
  })

  it('rejects premature_weeks of -1', () => {
    const result = babySchema.safeParse({ ...validBaby, premature_weeks: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects premature_weeks of 21', () => {
    const result = babySchema.safeParse({ ...validBaby, premature_weeks: 21 })
    expect(result.success).toBe(false)
  })

  it('accepts all 9 temperament enum values', () => {
    const temperaments = [
      'easy', 'moderate', 'spirited', 'sensitive', 'adaptable',
      'slow_to_warm', 'persistent', 'not_sure', 'other',
    ]
    for (const temperament of temperaments) {
      const result = babySchema.safeParse({ ...validBaby, temperament })
      expect(result.success).toBe(true)
    }
  })

  it('accepts medical_conditions at 1000 char limit', () => {
    const result = babySchema.safeParse({
      ...validBaby,
      medical_conditions: 'a'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects medical_conditions exceeding 1000 chars', () => {
    const result = babySchema.safeParse({
      ...validBaby,
      medical_conditions: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts temperament_notes at 1000 char limit', () => {
    const result = babySchema.safeParse({
      ...validBaby,
      temperament_notes: 'a'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })
})

describe('step2Schema', () => {
  it('requires bedtime, waketime, and method', () => {
    const result = step2Schema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts valid data with required fields', () => {
    const result = step2Schema.safeParse({
      current_bedtime: '19:30',
      current_waketime: '06:00',
      falling_asleep_method: 'nursing',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional additional_sleep_times array', () => {
    const result = step2Schema.safeParse({
      current_bedtime: '19:30',
      current_waketime: '06:00',
      falling_asleep_method: 'nursing',
      additional_sleep_times: [{ bedtime: '20:00', waketime: '07:00' }],
    })
    expect(result.success).toBe(true)
  })
})

describe('step3Schema', () => {
  it('accepts night_wakings_count at boundary 0', () => {
    const result = step3Schema.safeParse({ night_wakings_count: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts night_wakings_count at boundary 20', () => {
    const result = step3Schema.safeParse({ night_wakings_count: 20 })
    expect(result.success).toBe(true)
  })

  it('rejects night_wakings_count over 20', () => {
    const result = step3Schema.safeParse({ night_wakings_count: 21 })
    expect(result.success).toBe(false)
  })

  it('accepts night_wakings_description at 1000 char limit', () => {
    const result = step3Schema.safeParse({
      night_wakings_count: 2,
      night_wakings_description: 'a'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects night_wakings_description over 1000 chars', () => {
    const result = step3Schema.safeParse({
      night_wakings_count: 2,
      night_wakings_description: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })
})

describe('step4Schema', () => {
  it('accepts nap_count at boundary 0', () => {
    const result = step4Schema.safeParse({ nap_count: 0 })
    expect(result.success).toBe(true)
  })

  it('accepts nap_count at boundary 10', () => {
    const result = step4Schema.safeParse({ nap_count: 10 })
    expect(result.success).toBe(true)
  })

  it('rejects nap_count over 10', () => {
    const result = step4Schema.safeParse({ nap_count: 11 })
    expect(result.success).toBe(false)
  })
})

describe('step5Schema', () => {
  it('requires at least 1 problem', () => {
    const result = step5Schema.safeParse({
      problems: [],
      problem_description: 'My baby wakes up a lot',
    })
    expect(result.success).toBe(false)
  })

  it('allows missing problem_description', () => {
    const result = step5Schema.safeParse({
      problems: ['frequent_wakings'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts problem_description at 2000 char limit', () => {
    const result = step5Schema.safeParse({
      problems: ['frequent_wakings'],
      problem_description: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects problem_description over 2000 chars', () => {
    const result = step5Schema.safeParse({
      problems: ['frequent_wakings'],
      problem_description: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe('step6Schema', () => {
  it('accepts crying_comfort_level at boundary 1', () => {
    const result = step6Schema.safeParse({ crying_comfort_level: 1 })
    expect(result.success).toBe(true)
  })

  it('accepts crying_comfort_level at boundary 5', () => {
    const result = step6Schema.safeParse({ crying_comfort_level: 5 })
    expect(result.success).toBe(true)
  })

  it('rejects crying_comfort_level of 0', () => {
    const result = step6Schema.safeParse({ crying_comfort_level: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects crying_comfort_level of 6', () => {
    const result = step6Schema.safeParse({ crying_comfort_level: 6 })
    expect(result.success).toBe(false)
  })
})

describe('step7Schema', () => {
  it('requires at least one success goal', () => {
    const result = step7Schema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts one or more success goals', () => {
    const result = step7Schema.safeParse({
      success_goals: ['A consistent daily sleep schedule', 'other: Better mornings'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty success_goals array', () => {
    const result = step7Schema.safeParse({
      success_goals: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts additional_notes at 2000 char limit', () => {
    const result = step7Schema.safeParse({
      success_goals: ['A consistent daily sleep schedule'],
      additional_notes: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it('rejects additional_notes over 2000 chars', () => {
    const result = step7Schema.safeParse({
      success_goals: ['A consistent daily sleep schedule'],
      additional_notes: 'a'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe('intakeSchema edge cases', () => {
  it('accepts all optional fields as null (except baby_id)', () => {
    const result = intakeSchema.safeParse({
      baby_id: 'some-uuid',
      current_bedtime: null,
      current_waketime: null,
      falling_asleep_method: null,
      additional_sleep_times: null,
      night_wakings_count: null,
      night_wakings_description: null,
      night_waking_duration: null,
      night_waking_pattern: null,
      nap_count: null,
      nap_duration: null,
      nap_method: null,
      nap_location: null,
      problems: null,
      problem_description: null,
      crying_comfort_level: null,
      parent_constraints: null,
      success_goals: null,
      success_description: null,
      additional_notes: null,
      data: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty problems array (nullable in complete schema)', () => {
    const result = intakeSchema.safeParse({
      baby_id: 'some-uuid',
      problems: [],
    })
    expect(result.success).toBe(true)
  })

  it('accepts max length strings at exact boundary', () => {
    const result = intakeSchema.safeParse({
      baby_id: 'some-uuid',
      night_wakings_description: 'a'.repeat(1000),
      night_waking_pattern: 'a'.repeat(1000),
      problem_description: 'a'.repeat(2000),
      parent_constraints: 'a'.repeat(1000),
      success_description: 'a'.repeat(1000),
      additional_notes: 'a'.repeat(2000),
    })
    expect(result.success).toBe(true)
  })

  it('accepts data field as arbitrary JSON object', () => {
    const result = intakeSchema.safeParse({
      baby_id: 'some-uuid',
      data: { custom_key: 'value', nested: { foo: 123 } },
    })
    expect(result.success).toBe(true)
  })
})
