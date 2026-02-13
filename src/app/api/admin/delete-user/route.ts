import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const adminSupabase = getSupabaseAdmin()

    // Look up target user by email
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers()

    if (listError) {
      return NextResponse.json({ error: 'Failed to list users' }, { status: 500 })
    }

    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch profile and data counts for summary
    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', targetUser.id)
      .single()

    const { count: babyCount } = await adminSupabase
      .from('babies')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)

    const { count: planCount } = await adminSupabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)

    const { count: diaryCount } = await adminSupabase
      .from('sleep_diary_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)

    // Stripe cleanup
    let stripeCustomerDeleted = false
    const stripeCustomerId = targetProfile?.stripe_customer_id
    const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

    if (stripeCustomerId && isStripeEnabled) {
      try {
        // Cancel all active subscriptions immediately
        const subs = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 100,
        })
        for (const sub of subs.data) {
          if (sub.status !== 'canceled') {
            await stripe.subscriptions.cancel(sub.id)
          }
        }

        // Delete the Stripe customer
        await stripe.customers.del(stripeCustomerId)
        stripeCustomerDeleted = true
      } catch (e) {
        console.error('[admin] Failed to clean up Stripe customer:', e)
        // Continue with user deletion even if Stripe cleanup fails
      }
    }

    // Delete auth user — cascades to all DB tables
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(targetUser.id)

    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete user: ${deleteError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: {
        email,
        babies: babyCount || 0,
        plans: planCount || 0,
        diaryEntries: diaryCount || 0,
        stripeCustomerDeleted,
      },
    })
  } catch (error) {
    console.error('Admin delete-user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
