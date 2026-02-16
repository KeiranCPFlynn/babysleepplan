export type StripeMode = 'test' | 'live'

function normalizeMode(rawMode: string | undefined): StripeMode | null {
  if (!rawMode) return null

  const normalized = rawMode.trim().toLowerCase()
  if (normalized === 'test' || normalized === 'live') {
    return normalized
  }

  throw new Error(`Invalid STRIPE_MODE "${rawMode}". Expected "test" or "live".`)
}

/**
 * Resolve active Stripe mode.
 * Priority:
 * 1) STRIPE_MODE
 * 2) Legacy STRIPE_SECRET_KEY prefix (sk_test_/sk_live_)
 * 3) Environment default (production -> live, otherwise test)
 */
export function getStripeMode(): StripeMode {
  const configuredMode = normalizeMode(process.env.STRIPE_MODE)
  if (configuredMode) return configuredMode

  const legacySecret = process.env.STRIPE_SECRET_KEY
  if (legacySecret?.startsWith('sk_live_') || legacySecret?.startsWith('rk_live_')) return 'live'
  if (legacySecret?.startsWith('sk_test_') || legacySecret?.startsWith('rk_test_')) return 'test'

  return process.env.NODE_ENV === 'production' ? 'live' : 'test'
}

export function getStripeEnv(name: string, mode: StripeMode = getStripeMode()): string | undefined {
  const modeSuffix = mode.toUpperCase()
  return process.env[`${name}_${modeSuffix}`] || process.env[name]
}
