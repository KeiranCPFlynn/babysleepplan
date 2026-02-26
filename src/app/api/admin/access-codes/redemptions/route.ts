import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const codeId = request.nextUrl.searchParams.get('codeId')
    if (!codeId) {
      return NextResponse.json({ error: 'Missing codeId' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    // Get redemptions with user email from profiles
    const { data: redemptions, error } = await admin
      .from('access_code_redemptions')
      .select('id, user_id, trial_ends_at, created_at')
      .eq('access_code_id', codeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/access-codes/redemptions] Error:', error)
      return NextResponse.json({ error: 'Failed to load redemptions' }, { status: 500 })
    }

    // Fetch user emails for the redemptions
    const userIds = (redemptions || []).map(r => r.user_id)
    let userEmails: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      if (profiles) {
        userEmails = Object.fromEntries(profiles.map(p => [p.id, p.email]))
      }
    }

    const enriched = (redemptions || []).map(r => ({
      ...r,
      email: userEmails[r.user_id] || 'unknown',
    }))

    return NextResponse.json({ redemptions: enriched })
  } catch (error) {
    console.error('[admin/access-codes/redemptions] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
