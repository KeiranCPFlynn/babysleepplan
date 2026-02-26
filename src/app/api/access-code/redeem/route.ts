import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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

    const body = await request.json()
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const intakeId = typeof body.intakeId === 'string' ? body.intakeId : null
    const babyId = typeof body.babyId === 'string' ? body.babyId : null

    if (!code || code.length > 50) {
      return NextResponse.json({ error: 'Please enter a valid access code.' }, { status: 400 })
    }

    // Call the atomic redeem function via service role
    const admin = getSupabaseAdmin()
    const { data, error } = await admin.rpc('redeem_access_code', {
      p_code: code,
      p_user_id: user.id,
    })

    if (error) {
      console.error('[access-code] RPC error:', JSON.stringify(error))
      const isDev = process.env.NODE_ENV !== 'production'
      return NextResponse.json({
        error: isDev
          ? `RPC failed: ${error.message || error.code || JSON.stringify(error)}`
          : 'Something went wrong. Please try again.',
      }, { status: 500 })
    }

    // Supabase RPC with JSONB return can return the object directly or as a string
    const result = (typeof data === 'string' ? JSON.parse(data) : data) as {
      success: boolean; error?: string; trial_ends_at?: string; trial_days?: number; category?: string
    }

    if (!result || !result.success) {
      return NextResponse.json({ error: result?.error || 'Invalid code.' }, { status: 400 })
    }

    // If intakeId + babyId provided, activate intake and trigger plan generation
    let planId: string | null = null
    if (intakeId && babyId) {
      // Verify intake belongs to user and is in submitted state
      const { data: intake } = await supabase
        .from('intake_submissions')
        .select('id, status')
        .eq('id', intakeId)
        .eq('user_id', user.id)
        .single()

      if (intake && intake.status === 'submitted') {
        // Mark intake as paid
        await admin
          .from('intake_submissions')
          .update({ status: 'paid' })
          .eq('id', intakeId)

        // Create plan record
        const { data: plan, error: planError } = await admin
          .from('plans')
          .insert({
            user_id: user.id,
            baby_id: babyId,
            intake_submission_id: intakeId,
            plan_content: '',
            status: 'generating',
          })
          .select('id')
          .single()

        if (planError) {
          console.error('[access-code] Failed to create plan:', planError)
        } else if (plan) {
          planId = plan.id

          // Trigger plan generation asynchronously
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
              console.error('[access-code] Failed to trigger plan generation:', err)
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      trial_ends_at: result.trial_ends_at,
      trial_days: result.trial_days,
      category: result.category,
      ...(planId ? { planId, intakeId } : {}),
    })
  } catch (error) {
    console.error('[access-code] Redeem error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
