import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, SUBSCRIPTION_PRICE_ID, TRIAL_DAYS } from '@/lib/stripe'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { hasActiveSubscription } from '@/lib/subscription'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    // Verify plan exists, belongs to user, and is completed
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, user_id, baby_id, status')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.status !== 'completed') {
      return NextResponse.json({ error: 'Plan is not completed' }, { status: 400 })
    }

    // Get profile to check subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status, has_used_trial, trial_ends_at, trial_days_override')
      .eq('id', user.id)
      .single()

    // Prevent reactivation if already has active subscription
    if (hasActiveSubscription(profile?.subscription_status, isStripeEnabled, profile?.trial_ends_at)) {
      return NextResponse.json({ error: 'Already has active subscription' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Dev mode bypass: activate subscription directly
    if (!isStripeEnabled) {
      if (process.env.NODE_ENV === 'production') {
        console.error('STRIPE_ENABLED is false in production!')
        return NextResponse.json({ error: 'Payment system unavailable' }, { status: 503 })
      }
      console.log('[REACTIVATE] Bypassing Stripe for plan:', planId)

      const adminSupabase = getSupabaseAdmin()

      const periodEnd = new Date()
      periodEnd.setDate(periodEnd.getDate() + 30)

      await adminSupabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_period_end: periodEnd.toISOString(),
          has_used_trial: true,
        })
        .eq('id', user.id)

      return NextResponse.json({
        url: `${appUrl}/dashboard/resubscribe/payment/success?plan=${planId}&dev_mode=true`,
        devMode: true,
      })
    }

    // Production: Create Stripe checkout session
    // Determine trial days (admin override takes precedence)
    const trialDays = profile?.trial_days_override !== null && profile?.trial_days_override !== undefined
      ? profile.trial_days_override
      : 0 // Returning users don't get a trial

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const subscriptionData: Record<string, unknown> = {
      metadata: {
        plan_id: planId,
        user_id: user.id,
        baby_id: plan.baby_id,
      },
    }

    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: subscriptionData,
      metadata: {
        plan_id: planId,
        user_id: user.id,
        baby_id: plan.baby_id,
      },
      success_url: `${appUrl}/dashboard/resubscribe/payment/success?plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/resubscribe/payment?plan=${planId}`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Reactivate checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
