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
}

export const PLAN_PRICE = 2900 // $29.00 in cents
export const PLAN_PRICE_ID = process.env.STRIPE_PRICE_ID
