import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function ReactivateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; session_id?: string; dev_mode?: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { plan: planId, session_id, dev_mode } = await searchParams

  if (!planId) {
    redirect('/dashboard')
  }

  // Verify the plan belongs to this user
  const { data: plan } = await supabase
    .from('plans')
    .select('id, status, baby:babies(name)')
    .eq('id', planId)
    .eq('user_id', user.id)
    .single()

  if (!plan) {
    redirect('/dashboard')
  }

  // Webhook fallback: if we have a session_id, verify and activate subscription
  if (session_id && isStripeEnabled) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id)

      if (
        session.metadata?.plan_id === planId &&
        (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')
      ) {
        const userId = session.metadata.user_id

        if (userId) {
          const adminClient = getSupabaseAdmin()

          // Get subscription period end
          let periodEnd: string | null = null
          let ourStatus: 'active' | 'trialing' = 'active'
          if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string)
            const endTimestamp = sub.trial_end ?? sub.items.data[0]?.current_period_end
            if (endTimestamp) {
              periodEnd = new Date(endTimestamp * 1000).toISOString()
            }
            if (sub.status === 'trialing') {
              ourStatus = 'trialing'
            }
          }

          await adminClient
            .from('profiles')
            .update({
              subscription_status: ourStatus,
              has_used_trial: true,
              ...(periodEnd ? { subscription_period_end: periodEnd } : {}),
            })
            .eq('id', userId)
        }
      }
    } catch (err) {
      console.error('Stripe session verification fallback failed:', err)
    }
  }

  const baby = Array.isArray(plan.baby) ? plan.baby[0] ?? null : plan.baby
  const babyName = baby?.name || 'Baby'

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-5 sm:p-6">
      <Card className="border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden dark:border-green-800/60 dark:from-green-950/30 dark:to-slate-950">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800 dark:text-green-200">
            Plan Reactivated!
          </CardTitle>
          <CardDescription className="text-green-700 dark:text-green-300">
            {babyName}&apos;s sleep plan is ready to use again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8 space-y-4">
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            Your subscription is active and you have full access to your existing plan,
            diary, and weekly updates.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Button asChild className="bg-sky-700 hover:bg-sky-800">
              <Link href={`/dashboard/plans/${plan.id}`}>
                View Your Plan
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
