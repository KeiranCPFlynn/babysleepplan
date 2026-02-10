import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const currentStatus = profile?.subscription_status || 'inactive'

    return NextResponse.json({
      status: currentStatus,
      debug: {
        userId: user.id,
        stripeCustomerId: profile?.stripe_customer_id,
      }
    })
  } catch (error) {
    console.error('Verify subscription error:', error)
    return NextResponse.json({
      error: 'Internal error',
    }, { status: 500 })
  }
}
