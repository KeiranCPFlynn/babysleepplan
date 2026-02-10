export const MONTHLY_PRICE = 19
export const ADDITIONAL_BABY_PRICE = 9
export const TRIAL_DAYS = 5

export function hasActiveSubscription(
  status: string | null | undefined,
  stripeEnabled: boolean
): boolean {
  if (!stripeEnabled) return true
  return status === 'active' || status === 'trialing'
}

export function getDaysRemaining(periodEnd: string | null): number | null {
  if (!periodEnd) return null
  const end = new Date(periodEnd)
  const now = new Date()
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export function getSubscriptionLabel(status: string | null | undefined): string {
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
