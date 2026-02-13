import { describe, it, expect } from 'vitest'
import {
  hasActiveSubscription,
  getDaysRemaining,
  getSubscriptionLabel,
  MONTHLY_PRICE,
  ADDITIONAL_BABY_PRICE,
  TRIAL_DAYS,
} from '@/lib/subscription'

describe('hasActiveSubscription', () => {
  describe('when Stripe is enabled', () => {
    it('returns true for "active"', () => {
      expect(hasActiveSubscription('active', true)).toBe(true)
    })

    it('returns true for "trialing"', () => {
      expect(hasActiveSubscription('trialing', true)).toBe(true)
    })

    it('returns false for "cancelled"', () => {
      expect(hasActiveSubscription('cancelled', true)).toBe(false)
    })

    it('returns false for "inactive"', () => {
      expect(hasActiveSubscription('inactive', true)).toBe(false)
    })

    it('returns false for null', () => {
      expect(hasActiveSubscription(null, true)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(hasActiveSubscription(undefined, true)).toBe(false)
    })
  })

  describe('when Stripe is disabled', () => {
    it('returns true for any status (bypasses check)', () => {
      expect(hasActiveSubscription(null, false)).toBe(true)
      expect(hasActiveSubscription('cancelled', false)).toBe(true)
      expect(hasActiveSubscription(undefined, false)).toBe(true)
    })
  })
})

describe('getDaysRemaining', () => {
  it('returns positive number for future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const result = getDaysRemaining(future.toISOString())
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(11) // ceil can push up by 1
  })

  it('returns 0 for past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 5)
    expect(getDaysRemaining(past.toISOString())).toBe(0)
  })

  it('returns 0 for today (just passed)', () => {
    const now = new Date()
    now.setHours(now.getHours() - 1) // 1 hour ago
    expect(getDaysRemaining(now.toISOString())).toBe(0)
  })

  it('returns null for null input', () => {
    expect(getDaysRemaining(null)).toBeNull()
  })
})

describe('getSubscriptionLabel', () => {
  it('returns "Free Trial" for "trialing"', () => {
    expect(getSubscriptionLabel('trialing')).toBe('Free Trial')
  })

  it('returns "Active" for "active"', () => {
    expect(getSubscriptionLabel('active')).toBe('Active')
  })

  it('returns "Cancelled" for "cancelled"', () => {
    expect(getSubscriptionLabel('cancelled')).toBe('Cancelled')
  })

  it('returns "Inactive" for "inactive"', () => {
    expect(getSubscriptionLabel('inactive')).toBe('Inactive')
  })

  it('returns "Inactive" for null', () => {
    expect(getSubscriptionLabel(null)).toBe('Inactive')
  })

  it('returns "Inactive" for undefined', () => {
    expect(getSubscriptionLabel(undefined)).toBe('Inactive')
  })

  it('returns "Inactive" for unknown string', () => {
    expect(getSubscriptionLabel('something_else')).toBe('Inactive')
  })
})

describe('constants', () => {
  it('MONTHLY_PRICE equals 19', () => {
    expect(MONTHLY_PRICE).toBe(19)
  })

  it('ADDITIONAL_BABY_PRICE equals 9', () => {
    expect(ADDITIONAL_BABY_PRICE).toBe(9)
  })

  it('TRIAL_DAYS equals 5', () => {
    expect(TRIAL_DAYS).toBe(5)
  })
})
