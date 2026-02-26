import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization of admin client (same pattern as webhook route)
let supabaseAdmin: SupabaseClient | null = null
const isDev = process.env.NODE_ENV !== 'production'
const logInfo = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args)
  }
}

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}

export async function POST(request: NextRequest) {
  logInfo('=== Intake create API called ===')

  try {
    // Parse body first
    let babyId: string
    try {
      const body = await request.json()
      babyId = body.babyId
      logInfo('Request body parsed, babyId:', babyId)
    } catch (parseErr) {
      console.error('Failed to parse request body:', parseErr)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!babyId) {
      return NextResponse.json({ error: 'Missing babyId' }, { status: 400 })
    }

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    // Verify user is authenticated
    let user
    try {
      logInfo('Creating auth client...')
      const supabase = await createClient()
      logInfo('Getting user...')
      const { data, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
      }

      user = data.user
      logInfo('User authenticated:', user?.id)
    } catch (authErr) {
      console.error('Failed to create auth client:', authErr)
      return NextResponse.json({ error: 'Auth client error' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logInfo('Creating intake for baby:', babyId, 'user:', user.id)

    if (!babyId) {
      return NextResponse.json({ error: 'Missing babyId' }, { status: 400 })
    }

    const adminSupabase = getSupabaseAdmin()

    // Verify baby exists and belongs to user
    const { data: baby, error: babyError } = await adminSupabase
      .from('babies')
      .select('id')
      .eq('id', babyId)
      .eq('user_id', user.id)
      .single()

    if (babyError) {
      console.error('Baby lookup error:', babyError)
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    if (!baby) {
      console.error('Baby not found for id:', babyId)
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    logInfo('Baby verified:', baby.id)

    // Check for existing draft (any baby — only 1 draft allowed at a time)
    const { data: existingDraft } = await adminSupabase
      .from('intake_submissions')
      .select('id, baby_id')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingDraft) {
      // Same baby — return existing draft to continue
      if (existingDraft.baby_id === babyId) {
        return NextResponse.json({ intakeId: existingDraft.id, existing: true })
      }
      // Different baby — block: only 1 draft at a time
      return NextResponse.json(
        { error: 'draft_exists', draftId: existingDraft.id },
        { status: 409 }
      )
    }

    // Look for most recent submitted/paid intake for this baby to pre-populate
    const { data: previousIntake } = await adminSupabase
      .from('intake_submissions')
      .select('*')
      .eq('baby_id', babyId)
      .eq('user_id', user.id)
      .in('status', ['submitted', 'paid'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Create new intake, pre-populated from previous if available
    const insertPayload: Record<string, unknown> = {
      baby_id: babyId,
      user_id: user.id,
      data: previousIntake?.data ?? {},
    }

    if (previousIntake) {
      const copyFields = [
        'current_bedtime', 'current_waketime', 'falling_asleep_method',
        'night_wakings_count', 'night_wakings_description', 'night_waking_duration', 'night_waking_pattern',
        'nap_count', 'nap_duration', 'nap_method', 'nap_location',
        'problems', 'problem_description',
        'crying_comfort_level', 'parent_constraints',
        'success_description', 'additional_notes',
      ] as const
      for (const field of copyFields) {
        if (previousIntake[field] != null) {
          insertPayload[field] = previousIntake[field]
        }
      }
      logInfo('Pre-populated from previous intake:', previousIntake.id)
    }

    logInfo('Inserting intake with baby_id:', babyId)

    const { data: intake, error: intakeError } = await adminSupabase
      .from('intake_submissions')
      .insert(insertPayload)
      .select()
      .single()

    if (intakeError) {
      console.error('Failed to create intake:', {
        message: intakeError.message,
        code: intakeError.code,
        details: intakeError.details,
        hint: intakeError.hint,
      })
      return NextResponse.json({
        error: 'Failed to create intake',
      }, { status: 500 })
    }

    logInfo('Intake created:', intake.id)
    return NextResponse.json({ intakeId: intake.id, existing: false })
  } catch (error) {
    console.error('Intake creation error:', error)
    return NextResponse.json({
      error: 'An unexpected error occurred',
    }, { status: 500 })
  }
}
