import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// env.ts runs validateEnv() at module level, so we need dynamic imports
// after manipulating process.env

describe('env validation', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    // Start with required vars set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
    process.env.GEMINI_API_KEY = 'test-gemini-key'
    process.env.RESEND_API_KEY = 'test-resend-key'
    // Disable Stripe by default
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = 'false'
    delete process.env.STRIPE_MODE
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_SECRET_KEY_TEST
    delete process.env.STRIPE_SECRET_KEY_LIVE
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_WEBHOOK_SECRET_TEST
    delete process.env.STRIPE_WEBHOOK_SECRET_LIVE
    delete process.env.STRIPE_PRICE_ID
    delete process.env.STRIPE_PRICE_ID_TEST
    delete process.env.STRIPE_PRICE_ID_LIVE
    delete process.env.STRIPE_ADDITIONAL_BABY_PRICE_ID
    delete process.env.STRIPE_ADDITIONAL_BABY_PRICE_ID_TEST
    delete process.env.STRIPE_ADDITIONAL_BABY_PRICE_ID_LIVE
    // Not production by default
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'test'
    // Clear build phase
    delete process.env.NEXT_PHASE
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('throws when SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    await expect(import('@/lib/env')).rejects.toThrow('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('throws when ANON_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    await expect(import('@/lib/env')).rejects.toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  })

  it('throws when SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    await expect(import('@/lib/env')).rejects.toThrow('SUPABASE_SERVICE_ROLE_KEY')
  })

  it('throws when GEMINI_API_KEY is missing', async () => {
    delete process.env.GEMINI_API_KEY
    await expect(import('@/lib/env')).rejects.toThrow('GEMINI_API_KEY')
  })

  it('throws when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY
    await expect(import('@/lib/env')).rejects.toThrow('RESEND_API_KEY')
  })

  it('throws for production-only vars in production mode', async () => {
    ;(process.env as Record<string, string | undefined>).NODE_ENV = 'production'
    delete process.env.INTERNAL_API_KEY
    delete process.env.NEXT_PUBLIC_APP_URL
    delete process.env.NEXT_PUBLIC_SITE_URL
    await expect(import('@/lib/env')).rejects.toThrow('INTERNAL_API_KEY')
  })

  it('throws for Stripe vars when Stripe is enabled', async () => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = 'true'
    await expect(import('@/lib/env')).rejects.toThrow('STRIPE_SECRET_KEY')
  })

  it('does NOT throw when mode-scoped Stripe vars are set', async () => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = 'true'
    process.env.STRIPE_MODE = 'live'
    process.env.STRIPE_SECRET_KEY_LIVE = 'sk_live_test_key'
    process.env.STRIPE_WEBHOOK_SECRET_LIVE = 'whsec_live_test_key'
    process.env.STRIPE_PRICE_ID_LIVE = 'price_live_main'
    process.env.STRIPE_ADDITIONAL_BABY_PRICE_ID_LIVE = 'price_live_extra'
    await expect(import('@/lib/env')).resolves.not.toThrow()
  })

  it('throws when STRIPE_MODE is invalid', async () => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = 'true'
    process.env.STRIPE_MODE = 'staging'
    await expect(import('@/lib/env')).rejects.toThrow('STRIPE_MODE')
  })

  it('does NOT throw for Stripe vars when Stripe is disabled', async () => {
    process.env.NEXT_PUBLIC_STRIPE_ENABLED = 'false'
    await expect(import('@/lib/env')).resolves.not.toThrow()
  })

  it('does NOT throw during build phase', async () => {
    process.env.NEXT_PHASE = 'phase-production-build'
    // Remove all required vars
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.GEMINI_API_KEY
    await expect(import('@/lib/env')).resolves.not.toThrow()
  })

  it('lists all missing vars in error message', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.GEMINI_API_KEY
    delete process.env.RESEND_API_KEY
    try {
      await import('@/lib/env')
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const message = (err as Error).message
      expect(message).toContain('NEXT_PUBLIC_SUPABASE_URL')
      expect(message).toContain('GEMINI_API_KEY')
      expect(message).toContain('RESEND_API_KEY')
    }
  })
})
