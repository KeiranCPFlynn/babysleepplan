import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

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

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { action, value } = await request.json()
    const adminSupabase = getSupabaseAdmin()

    switch (action) {
      case 'setTrialOverride': {
        const days = typeof value === 'number' ? value : null
        if (days !== null && (days < 0 || days > 365)) {
          return NextResponse.json({ error: 'Trial days must be between 0 and 365' }, { status: 400 })
        }

        const { error } = await adminSupabase
          .from('profiles')
          .update({ trial_days_override: days })
          .eq('id', user.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, trial_days_override: days })
      }

      case 'endTrialNow': {
        // Find the user's Stripe customer ID
        const { data: userProfile } = await adminSupabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single()

        if (!userProfile?.stripe_customer_id) {
          // No Stripe customer (dev mode) — update database directly
          const periodEnd = new Date()
          periodEnd.setDate(periodEnd.getDate() + 30)
          const { error } = await adminSupabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_period_end: periodEnd.toISOString(),
            })
            .eq('id', user.id)

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
          }

          return NextResponse.json({ success: true, message: 'Trial ended (dev mode). Status set to active.' })
        }

        // Find active trialing subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: userProfile.stripe_customer_id,
          status: 'trialing',
          limit: 1,
        })

        if (subscriptions.data.length === 0) {
          return NextResponse.json({ error: 'No trialing subscription found' }, { status: 400 })
        }

        // End trial immediately — Stripe will attempt payment
        const updatedSub = await stripe.subscriptions.update(subscriptions.data[0].id, {
          trial_end: 'now',
        })

        // Store the updated period end
        const endTimestamp = updatedSub.items.data[0]?.current_period_end
        if (endTimestamp) {
          await adminSupabase
            .from('profiles')
            .update({
              subscription_period_end: new Date(endTimestamp * 1000).toISOString(),
            })
            .eq('id', user.id)
        }

        return NextResponse.json({ success: true, message: 'Trial ended. Stripe will now attempt payment.' })
      }

      case 'resetSubscription': {
        const { error } = await adminSupabase
          .from('profiles')
          .update({
            subscription_status: 'inactive',
            stripe_customer_id: null,
            has_used_trial: false,
          })
          .eq('id', user.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
