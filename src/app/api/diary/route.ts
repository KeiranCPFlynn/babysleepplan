import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

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

// GET: Fetch diary entries for a plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from('sleep_diary_entries')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('Failed to fetch diary entries:', error)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Diary GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create or update a diary entry (upsert by plan_id + date)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      planId,
      date,
      bedtime,
      wakeTime,
      nightWakings,
      nightWakingDuration,
      napCount,
      napTotalMinutes,
      mood,
      notes,
    } = body

    if (!planId || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns this plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // Upsert the entry
    const adminSupabase = getSupabaseAdmin()
    const { data: entry, error } = await adminSupabase
      .from('sleep_diary_entries')
      .upsert(
        {
          plan_id: planId,
          user_id: user.id,
          date,
          bedtime: bedtime || null,
          wake_time: wakeTime || null,
          night_wakings: nightWakings ?? 0,
          night_waking_duration: nightWakingDuration || null,
          nap_count: napCount ?? 0,
          nap_total_minutes: napTotalMinutes ?? 0,
          mood: mood || null,
          notes: notes || null,
        },
        {
          onConflict: 'plan_id,date',
        }
      )
      .select()
      .single()

    if (error) {
      console.error('Failed to save diary entry:', error)
      return NextResponse.json(
        { error: 'Failed to save entry', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Diary POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
