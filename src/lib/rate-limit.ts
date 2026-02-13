/**
 * Simple in-memory rate limiter for API routes.
 *
 * Limits are per-key (typically user ID). The store resets on deploy
 * since it lives in process memory — acceptable for cost-protection
 * on AI endpoints but not suitable for security-critical rate limiting.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window */
  max: number
  /** Window duration in milliseconds */
  windowMs: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

export function createRateLimiter(name: string, options: RateLimiterOptions) {
  // Each limiter gets its own isolated store
  if (!stores.has(name)) {
    stores.set(name, new Map())
  }
  const store = stores.get(name)!

  return {
    /**
     * Check if a key is rate-limited.
     * Returns { limited: false } if allowed, or { limited: true, retryAfterMs } if blocked.
     */
    check(key: string): { limited: false } | { limited: true; retryAfterMs: number } {
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + options.windowMs })
        return { limited: false }
      }

      entry.count++

      if (entry.count > options.max) {
        return { limited: true, retryAfterMs: entry.resetAt - now }
      }

      return { limited: false }
    },
  }
}

// Pre-configured limiters for AI endpoints (expensive operations)
// 5 plan generations per user per hour
export const planGenerationLimiter = createRateLimiter('generate-plan', {
  max: 5,
  windowMs: 60 * 60 * 1000,
})

// 10 weekly reviews per user per hour
export const weeklyReviewLimiter = createRateLimiter('diary-review', {
  max: 10,
  windowMs: 60 * 60 * 1000,
})

// 5 plan updates per user per hour
export const planUpdateLimiter = createRateLimiter('diary-plan-update', {
  max: 5,
  windowMs: 60 * 60 * 1000,
})
