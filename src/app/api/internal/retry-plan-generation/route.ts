import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

// Must be higher than /api/generate-plan maxDuration (300s) to avoid overlap retries.
const STALE_THRESHOLD_MS = 8 * 60 * 1000
const MAX_PLANS_PER_RUN = 1

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const internalKey = process.env.INTERNAL_API_KEY

  if (process.env.NODE_ENV !== 'production') return true

  return (
    !!cronSecret && authHeader === `Bearer ${cronSecret}`
  ) || (
    !!internalKey && authHeader === `Bearer ${internalKey}`
  )
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const internalKey = process.env.INTERNAL_API_KEY

    if (!appUrl || !internalKey) {
      return NextResponse.json(
        { error: 'Missing NEXT_PUBLIC_APP_URL or INTERNAL_API_KEY' },
        { status: 500 }
      )
    }

    const staleBefore = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString()

    const { data: stalePlans, error: stalePlansError } = await supabase
      .from('plans')
      .select('id, updated_at')
      .eq('status', 'generating')
      .lt('updated_at', staleBefore)
      .order('updated_at', { ascending: true })
      .limit(MAX_PLANS_PER_RUN)

    if (stalePlansError) {
      console.error('[retry-plan-generation] failed to load stale plans:', stalePlansError)
      return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
    }

    if (!stalePlans || stalePlans.length === 0) {
      return NextResponse.json({ success: true, retried: 0 })
    }

    const results: Array<{ planId: string; ok: boolean; status: number }> = []

    for (const plan of stalePlans) {
      console.log('[retry-plan-generation] retrying plan', { planId: plan.id, updatedAt: plan.updated_at })

      const response = await fetch(`${appUrl}/api/generate-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${internalKey}`,
        },
        body: JSON.stringify({ planId: plan.id }),
        cache: 'no-store',
      })

      results.push({
        planId: plan.id,
        ok: response.ok,
        status: response.status,
      })
    }

    return NextResponse.json({
      success: true,
      retried: results.length,
      results,
    })
  } catch (error) {
    console.error('[retry-plan-generation] unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
