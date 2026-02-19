/**
 * Validate required environment variables at runtime.
 * Import this module early (e.g. in root layout) to fail fast.
 *
 * The validation runs only on the server and is skipped during the Next.js
 * build phase (where server-only env vars aren't available).
 */
import { getStripeMode, type StripeMode } from '@/lib/stripe-config'

function validateEnv() {
  // Skip during build phase or on the client
  if (typeof window !== 'undefined') return
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const isProduction = process.env.NODE_ENV === 'production'
  const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
  const missing: string[] = []

  function requireEnv(name: string) {
    if (!process.env[name]) {
      missing.push(name)
    }
  }

  function requireEnvInProduction(name: string) {
    if (!process.env[name] && isProduction) {
      missing.push(`${name} (production only)`)
    }
  }

  function requireStripeEnv(name: string, mode: StripeMode) {
    const modeKey = `${name}_${mode.toUpperCase()}`
    if (!process.env[name] && !process.env[modeKey]) {
      missing.push(`${name} (set ${modeKey} or ${name})`)
    }
  }

  // Always required
  requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  requireEnv('GEMINI_API_KEY')
  requireEnv('RESEND_API_KEY')

  // Required in production
  requireEnvInProduction('INTERNAL_API_KEY')
  requireEnvInProduction('NEXT_PUBLIC_APP_URL')
  requireEnvInProduction('NEXT_PUBLIC_SITE_URL')

  // Turnstile must be configured as a pair in production.
  if (isProduction) {
    const hasTurnstileSecret = !!process.env.TURNSTILE_SECRET_KEY
    const hasTurnstileSiteKey = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    if (hasTurnstileSecret && !hasTurnstileSiteKey) {
      missing.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY (required when TURNSTILE_SECRET_KEY is set)')
    }
    if (hasTurnstileSiteKey && !hasTurnstileSecret) {
      missing.push('TURNSTILE_SECRET_KEY (required when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set)')
    }
  }

  // Required when Stripe is enabled
  if (isStripeEnabled) {
    let stripeMode: StripeMode
    try {
      stripeMode = getStripeMode()
    } catch {
      missing.push('STRIPE_MODE (must be "test" or "live" when set)')
      stripeMode = 'test'
    }

    requireStripeEnv('STRIPE_SECRET_KEY', stripeMode)
    requireStripeEnv('STRIPE_WEBHOOK_SECRET', stripeMode)
    requireStripeEnv('STRIPE_PRICE_ID', stripeMode)
    requireStripeEnv('STRIPE_ADDITIONAL_BABY_PRICE_ID', stripeMode)
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}`
    )
  }
}

validateEnv()

export {}
