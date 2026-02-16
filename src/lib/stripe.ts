import Stripe from 'stripe'
import { getStripeEnv, getStripeMode } from '@/lib/stripe-config'

let stripeInstance: Stripe | null = null
export const STRIPE_MODE = getStripeMode()

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = getStripeEnv('STRIPE_SECRET_KEY', STRIPE_MODE)
    if (!secretKey) {
      throw new Error(
        `Missing Stripe secret key for mode "${STRIPE_MODE}". Set STRIPE_SECRET_KEY_${STRIPE_MODE.toUpperCase()} or STRIPE_SECRET_KEY.`
      )
    }
    if (
      (STRIPE_MODE === 'live' && (secretKey.startsWith('sk_test_') || secretKey.startsWith('rk_test_'))) ||
      (STRIPE_MODE === 'test' && (secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_')))
    ) {
      throw new Error(
        `Stripe secret key does not match STRIPE_MODE="${STRIPE_MODE}".`
      )
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return stripeInstance
}

// Legacy export for backwards compatibility - lazy getter
export const stripe = {
  get customers() { return getStripe().customers },
  get checkout() { return getStripe().checkout },
  get webhooks() { return getStripe().webhooks },
  get billingPortal() { return getStripe().billingPortal },
  get subscriptions() { return getStripe().subscriptions },
  get subscriptionItems() { return getStripe().subscriptionItems },
}

export const MONTHLY_PRICE_CENTS = 1900 // $19.00/month in cents
export const ADDITIONAL_BABY_PRICE_CENTS = 900 // $9.00/month in cents
export const TRIAL_DAYS = 5
export const STRIPE_WEBHOOK_SECRET = getStripeEnv('STRIPE_WEBHOOK_SECRET', STRIPE_MODE)
export const SUBSCRIPTION_PRICE_ID = getStripeEnv('STRIPE_PRICE_ID', STRIPE_MODE)
export const SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID = getStripeEnv('STRIPE_ADDITIONAL_BABY_PRICE_ID', STRIPE_MODE)
