export const MONTHLY_PRICE = 19
export const ADDITIONAL_BABY_PRICE = 9
export const TRIAL_DAYS = 5

export const FOUNDING_OFFER = {
  active: true,
  code: 'FOUNDING50',
  discount: '50% off your first 3 months',
  seats: 50,
} as const

export const PRICING_COPY = {
  trialLead: `$0 for ${TRIAL_DAYS} days. Then $${MONTHLY_PRICE}/month. Cancel anytime.`,
  trialShort: `$0 for ${TRIAL_DAYS} days`,
  paidShort: `Then $${MONTHLY_PRICE}/month, cancel anytime`,
  monthlyBilling: 'Billed monthly. Cancel anytime.',
  additionalBabyBilling: 'Added to your existing subscription. Cancel anytime.',
  promoCodeHint: 'Have a promo code? Enter it on the Stripe checkout page after you continue.',
  stripeFooter: 'Credit card required. Cancel anytime. Secure payment powered by Stripe.',
  emailPricing: `${TRIAL_DAYS}-day free trial · $${MONTHLY_PRICE}/month · Cancel anytime`,
} as const

/**
 * Single source of truth: is this user active?
 * Active = Stripe subscription active/trialing OR access-code trial still valid.
 */
export function hasActiveSubscription(
  status: string | null | undefined,
  stripeEnabled: boolean,
  trialEndsAt?: string | null
): boolean {
  if (!stripeEnabled) return true
  if (status === 'active' || status === 'trialing') return true
  if (trialEndsAt && new Date(trialEndsAt) > new Date()) return true
  return false
}

export function hasAccessCodeTrial(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false
  return new Date(trialEndsAt) > new Date()
}

export function getDaysRemaining(periodEnd: string | null): number | null {
  if (!periodEnd) return null
  const end = new Date(periodEnd)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export function getSubscriptionLabel(
  status: string | null | undefined,
  trialEndsAt?: string | null
): string {
  if (hasAccessCodeTrial(trialEndsAt) && status !== 'active' && status !== 'trialing') {
    return 'Access Code Trial'
  }
  switch (status) {
    case 'trialing':
      return 'Free Trial'
    case 'active':
      return 'Active'
    case 'cancelled':
      return 'Cancelled'
    default:
      return 'Inactive'
  }
}
