import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Only available in dev mode
const isDevMode = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'false'

function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Only allow in dev mode
  if (!isDevMode) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { id } = await params

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = getSupabaseAdmin()

    // Verify plan exists and belongs to user
    const { data: plan, error: planError } = await adminSupabase
      .from('plans')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (plan.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Reset plan to generating status and clear content
    const { error: updateError } = await adminSupabase
      .from('plans')
      .update({
        status: 'generating',
        plan_content: null,
        error_message: null,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to reset plan:', updateError)
      return NextResponse.json({ error: 'Failed to reset plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan reset error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
