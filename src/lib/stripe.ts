import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
export const SUBSCRIPTION_PRICE_ID = process.env.STRIPE_PRICE_ID
export const SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID = process.env.STRIPE_ADDITIONAL_BABY_PRICE_ID
