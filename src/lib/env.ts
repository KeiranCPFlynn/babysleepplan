/**
 * Validate required environment variables at runtime.
 * Import this module early (e.g. in root layout) to fail fast.
 *
 * The validation runs only on the server and is skipped during the Next.js
 * build phase (where server-only env vars aren't available).
 */

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

  // Required when Stripe is enabled
  if (isStripeEnabled) {
    requireEnv('STRIPE_SECRET_KEY')
    requireEnv('STRIPE_WEBHOOK_SECRET')
    requireEnv('STRIPE_PRICE_ID')
    requireEnv('STRIPE_ADDITIONAL_BABY_PRICE_ID')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}`
    )
  }
}

validateEnv()

export {}
