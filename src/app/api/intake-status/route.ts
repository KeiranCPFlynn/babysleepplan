import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const intakeId = request.nextUrl.searchParams.get('intakeId')
    if (!intakeId) {
      return NextResponse.json({ error: 'Missing intakeId' }, { status: 400 })
    }

    // Get plan status for this intake
    const { data: plan } = await supabase
      .from('plans')
      .select('id, status')
      .eq('intake_submission_id', intakeId)
      .eq('user_id', user.id)
      .single()

    // Get subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      plan: plan ? { id: plan.id, status: plan.status } : null,
      subscriptionStatus: profile?.subscription_status || null,
    })
  } catch (error) {
    console.error('Intake status error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
