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

// Free schedule builder limiters (IP-based, not user-based)
import { createHash } from 'crypto'
import { type NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  )
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// 10 schedule previews per IP per day
export const freeSchedulePreviewLimiter = createRateLimiter('free-schedule-preview', {
  max: 10,
  windowMs: 24 * 60 * 60 * 1000,
})

// 3 PDF sends per IP per day (hard block)
export const freeSchedulePdfIpLimiter = createRateLimiter('free-schedule-pdf-ip', {
  max: 3,
  windowMs: 24 * 60 * 60 * 1000,
})

// 1 PDF send per email per day (in-memory; DB is authoritative for monthly)
export const freeSchedulePdfEmailDayLimiter = createRateLimiter('free-schedule-pdf-email', {
  max: 1,
  windowMs: 24 * 60 * 60 * 1000,
})
