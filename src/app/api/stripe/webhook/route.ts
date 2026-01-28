import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendPaymentConfirmationEmail } from '@/lib/email/send'

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

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status === 'paid') {
        const intakeId = session.metadata?.intake_id
        const userId = session.metadata?.user_id
        const babyId = session.metadata?.baby_id

        if (intakeId && userId && babyId) {
          const adminClient = getSupabaseAdmin()

          // Update intake status to paid
          const { error: updateError } = await adminClient
            .from('intake_submissions')
            .update({ status: 'paid' })
            .eq('id', intakeId)

          if (updateError) {
            console.error('Failed to update intake status:', updateError)
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
            fetch(`${appUrl}/api/generate-plan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ planId: plan.id }),
            }).catch((err) => {
              console.error('Failed to trigger plan generation:', err)
            })

            console.log(`Payment completed for intake ${intakeId}, generating plan ${plan.id}`)

            // Send payment confirmation email
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
                  '$29.00'
                )
              } catch (emailError) {
                console.error('Failed to send payment confirmation email:', emailError)
              }
            }
          }
        }
      }
      break
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session
      console.log(`Checkout session expired: ${session.id}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
