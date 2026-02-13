import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { SuccessClient } from './success-client'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string; dev_mode?: string; additional_baby?: string }>
}) {
  await requireAuth()

  const { id } = await params
  const { session_id, dev_mode, additional_baby } = await searchParams

  const supabase = await createClient()

  // Get intake with baby info
  const { data: intake } = await supabase
    .from('intake_submissions')
    .select('*, baby:babies(name)')
    .eq('id', id)
    .single()

  if (!intake) {
    redirect('/dashboard')
  }

  // Get the plan if it exists
  let { data: plan } = await supabase
    .from('plans')
    .select('id, status')
    .eq('intake_submission_id', id)
    .single()

  // Webhook fallback: if no plan exists and we have a Stripe session_id,
  // verify the session directly and create the plan
  if (!plan && session_id && isStripeEnabled) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)

      // Verify session metadata matches this intake (prevent tampering)
      if (
        session.metadata?.intake_id === id &&
        (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')
      ) {
        const userId = session.metadata.user_id
        const babyId = session.metadata.baby_id

        if (userId && babyId) {
          const adminClient = getSupabaseAdmin()

          // Idempotency check: re-verify no plan was created between our first check and now
          const { data: existingPlan } = await adminClient
            .from('plans')
            .select('id, status')
            .eq('intake_submission_id', id)
            .maybeSingle()

          if (existingPlan) {
            // Plan was created (likely by webhook) between our checks
            plan = existingPlan
          } else {
            // Update intake status to paid (only if still submitted)
            await adminClient
              .from('intake_submissions')
              .update({ status: 'paid' })
              .eq('id', id)
              .eq('status', 'submitted')

            // Get subscription period end from Stripe
            let periodEnd: string | null = null
            if (session.subscription) {
              const sub = await stripe.subscriptions.retrieve(session.subscription as string)
              const endTimestamp = sub.trial_end ?? sub.items.data[0]?.current_period_end
              if (endTimestamp) {
                periodEnd = new Date(endTimestamp * 1000).toISOString()
              }
            }

            // Update profile subscription status
            await adminClient
              .from('profiles')
              .update({
                subscription_status: 'trialing',
                has_used_trial: true,
                ...(periodEnd ? { subscription_period_end: periodEnd } : {}),
              })
              .eq('id', userId)

            // Create plan record
            const { data: newPlan } = await adminClient
              .from('plans')
              .insert({
                user_id: userId,
                baby_id: babyId,
                intake_submission_id: id,
                plan_content: '',
                status: 'generating',
              })
              .select('id, status')
              .single()

            if (newPlan) {
              plan = newPlan

              // Fire-and-forget: trigger plan generation
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const internalKey = process.env.INTERNAL_API_KEY
              if (!internalKey) {
                console.error('INTERNAL_API_KEY is not set — cannot trigger plan generation')
              } else {
                fetch(`${appUrl}/api/generate-plan`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${internalKey}`,
                  },
                  body: JSON.stringify({ planId: newPlan.id }),
                }).catch((err) => {
                  console.error('Failed to trigger plan generation from success page:', err)
                })
              }
            }
          }
        }
      }
    } catch (err) {
      // Stripe verification failed - fall through gracefully
      // The page will still poll via the client component
      console.error('Stripe session verification fallback failed:', err)
    }
  }

  // Re-trigger generation if plan is stuck in 'generating' or 'failed' state
  // (e.g. previous attempt failed due to missing env var or timeout)
  if (plan && (plan.status === 'generating' || plan.status === 'failed')) {
    // Ensure intake is marked as paid (may have been missed on first attempt)
    const adminClient = getSupabaseAdmin()
    adminClient
      .from('intake_submissions')
      .update({ status: 'paid' })
      .eq('id', id)
      .in('status', ['draft', 'submitted'])
      .then(({ error }) => {
        if (error) console.error('Failed to update intake status:', error)
      })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const internalKey = process.env.INTERNAL_API_KEY
    if (internalKey) {
      fetch(`${appUrl}/api/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${internalKey}`,
        },
        body: JSON.stringify({ planId: plan.id }),
      }).catch((err) => {
        console.error('Failed to re-trigger plan generation:', err)
      })
    }
  }

  const isDevMode = dev_mode === 'true' || !isStripeEnabled

  return (
    <SuccessClient
      intakeId={id}
      babyName={intake.baby?.name || 'Baby'}
      isDevMode={isDevMode}
      isAdditionalBaby={additional_baby === 'true'}
      initialPlan={plan ? { id: plan.id, status: plan.status } : null}
    />
  )
}
