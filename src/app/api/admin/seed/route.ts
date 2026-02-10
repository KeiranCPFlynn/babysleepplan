import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { TRIAL_DAYS } from '@/lib/stripe'

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
      .select('is_admin, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action || 'baby' // 'baby' or 'intake'

    const adminSupabase = getSupabaseAdmin()

    if (action === 'baby') {
      // Create a test baby only
      const babyName = body.name || 'Test Baby'
      const dob = new Date()
      dob.setMonth(dob.getMonth() - 6)

      const { data: baby, error: babyError } = await adminSupabase
        .from('babies')
        .insert({
          user_id: user.id,
          name: babyName,
          date_of_birth: dob.toISOString().split('T')[0],
          premature_weeks: 0,
          temperament: 'moderate',
        })
        .select()
        .single()

      if (babyError) {
        console.error('Failed to create baby:', babyError)
        return NextResponse.json({ error: babyError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, babyId: baby.id })
    }

    if (action === 'intake') {
      // Create a mock intake for an existing baby
      const babyId = body.babyId
      if (!babyId) {
        return NextResponse.json({ error: 'babyId is required' }, { status: 400 })
      }

      // Verify baby belongs to user
      const { data: baby, error: babyFetchError } = await supabase
        .from('babies')
        .select('id, name')
        .eq('id', babyId)
        .eq('user_id', user.id)
        .single()

      if (babyFetchError || !baby) {
        return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
      }

      const { data: intake, error: intakeError } = await adminSupabase
        .from('intake_submissions')
        .insert({
          user_id: user.id,
          baby_id: baby.id,
          current_bedtime: '19:30',
          current_waketime: '06:30',
          falling_asleep_method: 'rocking',
          night_wakings_count: 3,
          night_wakings_description: 'Wakes crying and needs to be rocked back to sleep each time. Usually happens around 11pm, 2am, and 4:30am.',
          night_waking_duration: '15_30',
          night_waking_pattern: 'Consistent pattern every night with wakings roughly every 2-3 hours. Harder to resettle after the 2am waking.',
          nap_count: 2,
          nap_duration: '30_60',
          nap_method: 'rocking',
          nap_location: 'arms',
          problems: ['frequent_wakings', 'short_naps', 'sleep_associations'],
          problem_description: 'Our baby wakes up 3+ times per night and can only fall asleep while being rocked. Naps are short (30-40 min) and only happen in our arms. We are exhausted and would like to help baby learn to fall asleep more independently while being gentle about it.',
          crying_comfort_level: 3,
          success_description: 'We would love for baby to fall asleep independently at bedtime, sleep through the night with maybe one feed, and take longer naps in the crib. We want a gentle approach that minimizes crying.',
          status: 'paid',
          data: {},
        })
        .select()
        .single()

      if (intakeError) {
        console.error('Failed to create intake:', intakeError)
        return NextResponse.json({ error: intakeError.message }, { status: 500 })
      }

      // If subscription is not active, set to trialing
      if (profile.subscription_status !== 'active' && profile.subscription_status !== 'trialing') {
        const periodEnd = new Date()
        periodEnd.setDate(periodEnd.getDate() + TRIAL_DAYS)
        await adminSupabase
          .from('profiles')
          .update({
            subscription_status: 'trialing',
            subscription_period_end: periodEnd.toISOString(),
            has_used_trial: true,
          })
          .eq('id', user.id)
      }

      return NextResponse.json({ success: true, babyId: baby.id, intakeId: intake.id })
    }

    return NextResponse.json({ error: 'Invalid action. Use "baby" or "intake".' }, { status: 400 })
  } catch (error) {
    console.error('Admin seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
