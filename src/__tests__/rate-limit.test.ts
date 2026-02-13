import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Must import fresh for each test to avoid shared state between the
// pre-configured limiters and our test limiters. We dynamically import
// after clearing the module cache in beforeEach.

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests under the limit', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-under', { max: 3, windowMs: 60000 })
    expect(limiter.check('user1').limited).toBe(false)
    expect(limiter.check('user1').limited).toBe(false)
    expect(limiter.check('user1').limited).toBe(false)
  })

  it('blocks requests over the limit', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-over', { max: 2, windowMs: 60000 })
    limiter.check('user1')
    limiter.check('user1')
    const result = limiter.check('user1')
    expect(result.limited).toBe(true)
  })

  it('resets after window expires', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-reset', { max: 1, windowMs: 60000 })
    limiter.check('user1')
    const blocked = limiter.check('user1')
    expect(blocked.limited).toBe(true)

    // Advance past the window
    vi.advanceTimersByTime(60001)

    const afterReset = limiter.check('user1')
    expect(afterReset.limited).toBe(false)
  })

  it('treats different keys independently', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-keys', { max: 1, windowMs: 60000 })
    limiter.check('userA')
    const blockedA = limiter.check('userA')
    expect(blockedA.limited).toBe(true)

    // userB should be independent
    const resultB = limiter.check('userB')
    expect(resultB.limited).toBe(false)
  })

  it('isolates stores for different limiter names', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter1 = createRateLimiter('store-1', { max: 1, windowMs: 60000 })
    const limiter2 = createRateLimiter('store-2', { max: 1, windowMs: 60000 })

    limiter1.check('user1')
    const blocked1 = limiter1.check('user1')
    expect(blocked1.limited).toBe(true)

    // limiter2 should be unaffected
    const result2 = limiter2.check('user1')
    expect(result2.limited).toBe(false)
  })

  it('returns correct retryAfterMs value', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-retry', { max: 1, windowMs: 60000 })
    limiter.check('user1')

    vi.advanceTimersByTime(10000) // 10 seconds in

    const result = limiter.check('user1')
    expect(result.limited).toBe(true)
    if (result.limited) {
      expect(result.retryAfterMs).toBe(50000) // 60000 - 10000
    }
  })

  it('starts fresh count after window reset', async () => {
    const { createRateLimiter } = await import('@/lib/rate-limit')
    const limiter = createRateLimiter('test-fresh', { max: 2, windowMs: 60000 })
    limiter.check('user1')
    limiter.check('user1')

    // Advance past window
    vi.advanceTimersByTime(60001)

    // Should be fresh - allow 2 more
    expect(limiter.check('user1').limited).toBe(false)
    expect(limiter.check('user1').limited).toBe(false)
    expect(limiter.check('user1').limited).toBe(true)
  })
})

describe('pre-configured limiters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('planGenerationLimiter allows 5 requests, blocks 6th', async () => {
    const { planGenerationLimiter } = await import('@/lib/rate-limit')
    for (let i = 0; i < 5; i++) {
      expect(planGenerationLimiter.check('user1').limited).toBe(false)
    }
    expect(planGenerationLimiter.check('user1').limited).toBe(true)
  })

  it('weeklyReviewLimiter allows 10 requests, blocks 11th', async () => {
    const { weeklyReviewLimiter } = await import('@/lib/rate-limit')
    for (let i = 0; i < 10; i++) {
      expect(weeklyReviewLimiter.check('user1').limited).toBe(false)
    }
    expect(weeklyReviewLimiter.check('user1').limited).toBe(true)
  })

  it('planUpdateLimiter allows 5 requests, blocks 6th', async () => {
    const { planUpdateLimiter } = await import('@/lib/rate-limit')
    for (let i = 0; i < 5; i++) {
      expect(planUpdateLimiter.check('user1').limited).toBe(false)
    }
    expect(planUpdateLimiter.check('user1').limited).toBe(true)
  })
})
