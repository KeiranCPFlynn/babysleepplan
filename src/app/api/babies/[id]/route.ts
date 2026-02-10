import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify the baby belongs to this user before deleting
    const { data: baby, error: fetchError } = await supabase
      .from('babies')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !baby) {
      return NextResponse.json({ error: 'Baby not found' }, { status: 404 })
    }

    // Check for active plans (generating or completed) — don't allow deletion
    const { count: activePlanCount } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('baby_id', id)
      .eq('user_id', user.id)
      .in('status', ['generating', 'completed'])

    if (activePlanCount && activePlanCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete a baby with an active sleep plan. Please cancel your subscription first.' },
        { status: 409 }
      )
    }

    // Delete the baby (cascades to intake_submissions, plans, diary entries, etc.)
    const { error: deleteError } = await supabase
      .from('babies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete baby:', deleteError)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete baby error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
