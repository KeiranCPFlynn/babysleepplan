import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, SUBSCRIPTION_PRICE_ID, SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID, TRIAL_DAYS } from '@/lib/stripe'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

    const { intakeId } = await request.json()

    if (!intakeId) {
      return NextResponse.json({ error: 'Missing intakeId' }, { status: 400 })
    }

    // Verify intake exists and belongs to user
    const { data: intake, error: intakeError } = await supabase
      .from('intake_submissions')
      .select('*, baby:babies(name)')
      .eq('id', intakeId)
      .eq('user_id', user.id)
      .single()

    if (intakeError || !intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    if (intake.status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Dev mode bypass: create plan directly
    if (!isStripeEnabled) {
      if (process.env.NODE_ENV === 'production') {
        console.error('STRIPE_ENABLED is false in production!')
        return NextResponse.json({ error: 'Payment system unavailable' }, { status: 503 })
      }
      console.log('[PAYMENT] Bypassing Stripe for intake:', intakeId)

      const adminSupabase = getSupabaseAdmin()

      // Update intake status to paid
      await adminSupabase
        .from('intake_submissions')
        .update({ status: 'paid' })
        .eq('id', intakeId)

      // Check if user has already used their free trial
      const { data: devProfile } = await adminSupabase
        .from('profiles')
        .select('has_used_trial')
        .eq('id', user.id)
        .single()

      const devStatus = devProfile?.has_used_trial ? 'active' : 'trialing'

      // Set subscription status with period end
      const periodEnd = new Date()
      periodEnd.setDate(periodEnd.getDate() + (devProfile?.has_used_trial ? 30 : TRIAL_DAYS))
      await adminSupabase
        .from('profiles')
        .update({
          subscription_status: devStatus,
          subscription_period_end: periodEnd.toISOString(),
          has_used_trial: true,
        })
        .eq('id', user.id)

      // Create plan record
      const { data: plan, error: planError } = await adminSupabase
        .from('plans')
        .insert({
          user_id: user.id,
          baby_id: intake.baby_id,
          intake_submission_id: intakeId,
          plan_content: '',
          status: 'generating',
        })
        .select()
        .single()

      if (planError) {
        console.error('Failed to create plan:', planError)
        throw planError
      }

      // Trigger plan generation asynchronously
      const internalKey = process.env.INTERNAL_API_KEY
      if (!internalKey) {
        console.error('INTERNAL_API_KEY is not set')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }
      fetch(`${appUrl}/api/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalKey}` },
        body: JSON.stringify({ planId: plan.id }),
      }).catch(err => console.error('Failed to trigger plan generation:', err))

      return NextResponse.json({
        url: `${appUrl}/dashboard/intake/${intakeId}/payment/success?dev_mode=true`,
        devMode: true,
      })
    }

    // Production: Use Stripe subscription
    // Get profile with admin overrides
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status, trial_days_override, has_used_trial')
      .eq('id', user.id)
      .single()

    const hasExistingSubscription = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing'

    // Determine trial days (admin override takes precedence, then check if trial already used)
    const trialDays = profile?.trial_days_override !== null && profile?.trial_days_override !== undefined
      ? profile.trial_days_override
      : profile?.has_used_trial
        ? 0
        : TRIAL_DAYS

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

    // If user has an active subscription, try to add baby as additional line item
    if (hasExistingSubscription && customerId && SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID) {
      // Find the user's existing Stripe subscription
      const activeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })

      let subscription = activeSubscriptions.data[0]
      if (!subscription) {
        const trialingSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          limit: 1,
        })
        subscription = trialingSubscriptions.data[0]
      }

      if (subscription) {
        // Check if additional baby price item already exists on this subscription
        const existingItem = subscription.items.data.find(
          (item) => item.price.id === SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID
        )

        if (existingItem) {
          // Increment quantity on existing item
          await stripe.subscriptionItems.update(existingItem.id, {
            quantity: (existingItem.quantity ?? 0) + 1,
          })
        } else {
          // First additional baby — create new line item
          await stripe.subscriptionItems.create({
            subscription: subscription.id,
            price: SUBSCRIPTION_ADDITIONAL_BABY_PRICE_ID,
            quantity: 1,
          })
        }

        // Mark intake as paid and create plan directly (no checkout session needed)
        const adminSupabase = getSupabaseAdmin()

        await adminSupabase
          .from('intake_submissions')
          .update({ status: 'paid' })
          .eq('id', intakeId)

        const { data: plan, error: planError } = await adminSupabase
          .from('plans')
          .insert({
            user_id: user.id,
            baby_id: intake.baby_id,
            intake_submission_id: intakeId,
            plan_content: '',
            status: 'generating',
          })
          .select()
          .single()

        if (planError) {
          console.error('Failed to create plan:', planError)
          throw planError
        }

        // Trigger plan generation asynchronously
        const internalKey2 = process.env.INTERNAL_API_KEY
        if (!internalKey2) {
          console.error('INTERNAL_API_KEY is not set')
          return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }
        fetch(`${appUrl}/api/generate-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${internalKey2}` },
          body: JSON.stringify({ planId: plan.id }),
        }).catch(err => console.error('Failed to trigger plan generation:', err))

        return NextResponse.json({
          url: `${appUrl}/dashboard/intake/${intakeId}/payment/success?additional_baby=true`,
          additionalBaby: true,
        })
      }

      // DB says active but no Stripe subscription found (manual DB edit, dev testing)
      // Fall through to create a new checkout session
      console.warn(`User ${user.id} has subscription_status=${profile?.subscription_status} but no Stripe subscription found. Falling back to new checkout.`)
    }

    // First baby: Create subscription checkout session with free trial
    const subscriptionData: Record<string, unknown> = {
      metadata: {
        intake_id: intakeId,
        user_id: user.id,
        baby_id: intake.baby_id,
      },
    }

    // Only add trial if trialDays > 0
    if (trialDays > 0) {
      subscriptionData.trial_period_days = trialDays
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: SUBSCRIPTION_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: subscriptionData,
      metadata: {
        intake_id: intakeId,
        user_id: user.id,
        baby_id: intake.baby_id,
      },
      success_url: `${appUrl}/dashboard/intake/${intakeId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/intake/${intakeId}/payment/cancel`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
