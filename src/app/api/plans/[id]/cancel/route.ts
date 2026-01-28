import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only allow in test/free mode
  if (isStripeEnabled) {
    return NextResponse.json(
      { error: 'Cancel only available in test mode' },
      { status: 403 }
    )
  }

  try {
    const { id: planId } = await params

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify plan exists and belongs to user
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, user_id, status')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update plan status to failed
    const adminSupabase = getSupabaseAdmin()
    const { error: updateError } = await adminSupabase
      .from('plans')
      .update({
        status: 'failed',
        error_message: 'Cancelled by user (test mode)'
      })
      .eq('id', planId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel plan error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel plan' },
      { status: 500 }
    )
  }
}
