import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return null
  return user
}

// GET: List all access codes
export async function GET() {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = getSupabaseAdmin()
    const { data: codes, error } = await admin
      .from('access_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/access-codes] List error:', error)
      return NextResponse.json({ error: 'Failed to load codes' }, { status: 500 })
    }

    return NextResponse.json({ codes })
  } catch (error) {
    console.error('[admin/access-codes] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create or update an access code
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const admin = getSupabaseAdmin()

    // If id is provided, update; otherwise create
    if (body.id) {
      const { id, ...updates } = body
      // Don't allow updating code string or redeemed_count directly
      delete updates.redeemed_count
      delete updates.created_at
      updates.updated_at = new Date().toISOString()

      // Normalize code to uppercase
      if (updates.code) {
        updates.code = updates.code.toUpperCase().trim()
      }

      const { data, error } = await admin
        .from('access_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[admin/access-codes] Update error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update code' }, { status: 500 })
      }

      return NextResponse.json({ code: data })
    }

    // Create new
    const code = (body.code || '').toUpperCase().trim()
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('access_codes')
      .insert({
        code,
        trial_days: body.trial_days ?? 14,
        max_redemptions: body.max_redemptions ?? null,
        starts_at: body.starts_at ?? null,
        expires_at: body.expires_at ?? null,
        enabled: body.enabled ?? true,
        category: body.category ?? 'custom',
        note: body.note ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A code with this name already exists.' }, { status: 409 })
      }
      console.error('[admin/access-codes] Create error:', error)
      return NextResponse.json({ error: error.message || 'Failed to create code' }, { status: 500 })
    }

    return NextResponse.json({ code: data }, { status: 201 })
  } catch (error) {
    console.error('[admin/access-codes] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
