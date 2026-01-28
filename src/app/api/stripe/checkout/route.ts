import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLAN_PRICE } from '@/lib/stripe'
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

    // Bypass Stripe in development mode
    if (!isStripeEnabled) {
      console.log('[DEV MODE] Bypassing Stripe payment for intake:', intakeId)

      const adminSupabase = getSupabaseAdmin()

      // Update intake status to paid
      await adminSupabase
        .from('intake_submissions')
        .update({ status: 'paid' })
        .eq('id', intakeId)

      // Create plan record
      const { data: plan, error: planError } = await adminSupabase
        .from('plans')
        .insert({
          user_id: user.id,
          baby_id: intake.baby_id,
          intake_submission_id: intakeId,
          plan_content: '', // Placeholder until generation completes
          status: 'generating',
        })
        .select()
        .single()

      if (planError) {
        console.error('Failed to create plan:', planError)
        throw planError
      }

      // Trigger plan generation asynchronously
      fetch(`${appUrl}/api/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      }).catch(err => console.error('Failed to trigger plan generation:', err))

      // Return redirect URL to success page
      return NextResponse.json({
        url: `${appUrl}/dashboard/intake/${intakeId}/payment/success?dev_mode=true`,
        devMode: true
      })
    }

    // Production: Use Stripe
    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${intake.baby?.name || 'Baby'}'s Personalized Sleep Plan`,
              description: 'AI-generated sleep plan tailored to your baby',
            },
            unit_amount: PLAN_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/dashboard/intake/${intakeId}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/intake/${intakeId}/payment/cancel`,
      metadata: {
        intake_id: intakeId,
        user_id: user.id,
        baby_id: intake.baby_id,
      },
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
