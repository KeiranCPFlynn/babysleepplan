import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization of admin client
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}

async function handleIntakeUpdate(
  request: NextRequest,
  id: string
) {
  // Parse body
  let updateData: Record<string, unknown>
  try {
    updateData = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Verify user is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = getSupabaseAdmin()

  // Verify intake exists and belongs to user
  const { data: intake, error: intakeError } = await adminSupabase
    .from('intake_submissions')
    .select('id, user_id, status')
    .eq('id', id)
    .single()

  if (intakeError || !intake) {
    return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
  }

  if (intake.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Don't allow updates to submitted/paid intakes - but don't error, just skip
  if (intake.status !== 'draft') {
    // Return success with flag - this prevents errors from stale save attempts
    return NextResponse.json({
      intake,
      skipped: true,
      reason: 'Intake already submitted'
    })
  }

  // Remove fields that shouldn't be updated directly
  const { id: _, user_id, status, created_at, updated_at, ...safeData } = updateData as Record<string, unknown>

  // Update intake
  const { data: updated, error: updateError } = await adminSupabase
    .from('intake_submissions')
    .update(safeData)
    .eq('id', id)
    .select()
    .single()

  if (updateError) {
    console.error('Failed to update intake:', updateError)
    return NextResponse.json({
      error: 'Failed to update intake',
      details: updateError.message
    }, { status: 500 })
  }

  return NextResponse.json({ intake: updated })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return handleIntakeUpdate(request, id)
  } catch (error) {
    console.error('Intake update error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST handler for sendBeacon (used when page is closing)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    return handleIntakeUpdate(request, id)
  } catch (error) {
    console.error('Intake update error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
