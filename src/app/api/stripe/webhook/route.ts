import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, STRIPE_MODE, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendPaymentConfirmationEmail } from '@/lib/email/send'

const isDev = process.env.NODE_ENV !== 'production'

// Lazy initialization of admin client
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error(`Missing STRIPE_WEBHOOK_SECRET for mode "${STRIPE_MODE}"`)
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      // Trials fire with 'no_payment_required', paid sessions with 'paid'
      if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
        const intakeId = session.metadata?.intake_id
        const userId = session.metadata?.user_id
        const babyId = session.metadata?.baby_id

        if (intakeId && userId && babyId) {
          const adminClient = getSupabaseAdmin()

          // Idempotency check: verify this intake hasn't already been processed
          const { data: existingPlan } = await adminClient
            .from('plans')
            .select('id')
            .eq('intake_submission_id', intakeId)
            .maybeSingle()

          if (existingPlan) {
            if (isDev) console.log(`Webhook already processed for intake ${intakeId}, skipping (idempotency check)`)
            return NextResponse.json({ received: true, skipped: true })
          }

          // Update intake status to paid
          const { error: updateError } = await adminClient
            .from('intake_submissions')
            .update({ status: 'paid' })
            .eq('id', intakeId)

          if (updateError) {
            console.error('Failed to update intake status:', updateError)
          }

          // Set subscription status to trialing (trial just started)
          // Get period end from the Stripe subscription
          let periodEnd: string | null = null
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string)
            const endTimestamp = sub.trial_end ?? sub.items.data[0]?.current_period_end
            if (endTimestamp) {
              periodEnd = new Date(endTimestamp * 1000).toISOString()
            }
          }

          const { error: subscriptionError } = await adminClient
            .from('profiles')
            .update({
              subscription_status: 'trialing',
              has_used_trial: true,
              ...(periodEnd ? { subscription_period_end: periodEnd } : {}),
            })
            .eq('id', userId)

          if (subscriptionError) {
            console.error('Failed to update subscription status:', subscriptionError)
          }

          // Create a plan record
          const { data: plan, error: planError } = await adminClient
            .from('plans')
            .insert({
              user_id: userId,
              baby_id: babyId,
              intake_submission_id: intakeId,
              plan_content: '',
              status: 'generating',
            })
            .select()
            .single()

          if (planError) {
            console.error('Failed to create plan record:', planError)
          } else if (plan) {
            // Trigger plan generation asynchronously
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const internalKey = process.env.INTERNAL_API_KEY
            if (!internalKey) {
              console.error('INTERNAL_API_KEY is not set')
              return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
            }
            fetch(`${appUrl}/api/generate-plan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalKey}`,
              },
              body: JSON.stringify({ planId: plan.id }),
            }).catch((err) => {
              console.error('Failed to trigger plan generation:', err)
            })

            if (isDev) console.log(`Trial started for intake ${intakeId}, generating plan ${plan.id}`)

            // Send confirmation email
            const { data: baby } = await adminClient
              .from('babies')
              .select('name')
              .eq('id', babyId)
              .single()

            if (session.customer_email && baby?.name) {
              try {
                await sendPaymentConfirmationEmail(
                  session.customer_email,
                  baby.name,
                  'Free trial started'
                )
              } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError)
              }
            }
          }
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      if (isDev) console.log(`Checkout session expired: ${session.id}`)
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const adminClient = getSupabaseAdmin()

      // Find user by Stripe customer ID
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        const status = subscription.status === 'trialing' ? 'trialing' : 'active'
        const createdEndTimestamp = subscription.trial_end ?? subscription.items.data[0]?.current_period_end
        const createdPeriodEnd = createdEndTimestamp ? new Date(createdEndTimestamp * 1000).toISOString() : null

        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_status: status,
            has_used_trial: true,
            ...(createdPeriodEnd ? { subscription_period_end: createdPeriodEnd } : {}),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Failed to update subscription status:', error)
        } else {
          if (isDev) console.log(`Subscription created for user ${profile.id} with status ${status}`)
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const adminClient = getSupabaseAdmin()

      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        // Map Stripe subscription statuses to our statuses
        let ourStatus: string
        switch (subscription.status) {
          case 'trialing':
            ourStatus = 'trialing'
            break
          case 'active':
            ourStatus = 'active'
            break
          case 'canceled':
          case 'unpaid':
            ourStatus = 'cancelled'
            break
          case 'past_due':
            ourStatus = 'active' // Keep active during retry period
            break
          default:
            ourStatus = 'inactive'
        }

        const updatedEndTimestamp = subscription.trial_end ?? subscription.items.data[0]?.current_period_end
        const updatedPeriodEnd = updatedEndTimestamp ? new Date(updatedEndTimestamp * 1000).toISOString() : null

        const { error } = await adminClient
          .from('profiles')
          .update({
            subscription_status: ourStatus,
            ...(updatedPeriodEnd ? { subscription_period_end: updatedPeriodEnd } : {}),
          })
          .eq('id', profile.id)

        if (error) {
          console.error('Failed to update subscription status:', error)
        } else {
          if (isDev) console.log(`Subscription updated for user ${profile.id}: ${subscription.status} -> ${ourStatus}`)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const adminClient = getSupabaseAdmin()

      // Find user by Stripe customer ID and cancel subscription
      const { data: profile } = await adminClient
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile) {
        const { error } = await adminClient
          .from('profiles')
          .update({ subscription_status: 'cancelled' })
          .eq('id', profile.id)

        if (error) {
          console.error('Failed to cancel subscription:', error)
        } else {
          if (isDev) console.log(`Subscription cancelled for user ${profile.id}`)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      if (isDev) console.log(`Payment failed for customer ${customerId}, invoice ${invoice.id}`)
      break
    }

    default:
      if (isDev) console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
