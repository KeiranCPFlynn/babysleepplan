import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      // No Stripe customer (dev mode) — update database directly
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'cancelled',
          subscription_period_end: new Date().toISOString(),
        })
        .eq('id', user.id)

      return NextResponse.json({ success: true })
    }

    // Find active or trialing subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      limit: 10,
    })

    const activeSub = subscriptions.data.find(
      (s) => s.status === 'active' || s.status === 'trialing'
    )

    if (!activeSub) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Cancel at period end so user keeps access until billing cycle ends
    await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
