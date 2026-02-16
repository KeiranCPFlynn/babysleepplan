import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const MAINTENANCE_FLAG_KEY = 'maintenance_mode'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function parseEnabled(valueJson: unknown): boolean {
  if (!valueJson || typeof valueJson !== 'object') return false
  if (!('enabled' in valueJson)) return false

  const enabled = (valueJson as { enabled?: unknown }).enabled
  if (typeof enabled === 'boolean') return enabled
  if (typeof enabled === 'string') return enabled === 'true'
  return false
}

async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { userId: user.id }
}

export async function GET() {
  try {
    const adminCheck = await requireAdminUser()
    if (adminCheck.error) return adminCheck.error

    const adminSupabase = getSupabaseAdmin()
    const { data, error } = await adminSupabase
      .from('runtime_flags')
      .select('value_json, updated_at')
      .eq('key', MAINTENANCE_FLAG_KEY)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Failed to load runtime flags' }, { status: 500 })
    }

    return NextResponse.json({
      maintenanceMode: parseEnabled(data?.value_json),
      updatedAt: data?.updated_at || null,
    })
  } catch (error) {
    console.error('Admin runtime-flags GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdminUser()
    if (adminCheck.error) return adminCheck.error

    const { enabled } = await request.json()
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 })
    }

    const adminSupabase = getSupabaseAdmin()
    const { error } = await adminSupabase
      .from('runtime_flags')
      .upsert({
        key: MAINTENANCE_FLAG_KEY,
        value_json: { enabled },
        updated_by: adminCheck.userId,
      }, { onConflict: 'key' })

    if (error) {
      return NextResponse.json({ error: 'Failed to update runtime flag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, maintenanceMode: enabled })
  } catch (error) {
    console.error('Admin runtime-flags POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

