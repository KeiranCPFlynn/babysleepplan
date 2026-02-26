import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ArrowRight, Baby, Plus, RefreshCw } from 'lucide-react'
import { hasActiveSubscription } from '@/lib/subscription'
import { formatUniversalDate } from '@/lib/date-format'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function ResubscribePage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, has_used_trial, trial_ends_at')
    .eq('id', user.id)
    .single()

  const isActive = hasActiveSubscription(profile?.subscription_status, isStripeEnabled, profile?.trial_ends_at)

  // If already active, go to dashboard
  if (isActive) {
    redirect('/dashboard')
  }

  // If never subscribed before, go straight to intake
  if (!profile?.has_used_trial) {
    redirect('/dashboard/intake/new')
  }

  // Fetch completed plans with baby info
  const { data: plans } = await supabase
    .from('plans')
    .select(`
      id,
      status,
      created_at,
      baby:babies(id, name, date_of_birth)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  // No existing plans — go straight to intake
  if (!plans || plans.length === 0) {
    redirect('/dashboard/intake/new')
  }

  return (
    <div className="dashboard-surface max-w-2xl mx-auto space-y-6 p-5 sm:p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-sky-700 hover:text-sky-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome Back</h1>
        <p className="text-slate-600 dark:text-slate-300">
          Pick up where you left off, or start fresh with a new plan.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Your Existing Plans
        </h2>
        {plans.map((plan) => {
          const baby = Array.isArray(plan.baby) ? plan.baby[0] ?? null : plan.baby
          return (
            <Card
              key={plan.id}
              className="border-sky-200/80 bg-gradient-to-br from-sky-50/85 via-white to-rose-50/65 dark:border-slate-700 dark:from-slate-900/70 dark:via-slate-900/75 dark:to-rose-950/25"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0">
                      <Baby className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">
                        {baby?.name || 'Baby'}&apos;s Sleep Plan
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        Created {formatUniversalDate(plan.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="bg-sky-700 hover:bg-sky-800">
                  <Link href={`/dashboard/resubscribe/payment?plan=${plan.id}`}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    Reactivate This Plan
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-950 px-3 text-slate-500">or</span>
        </div>
      </div>

      <div className="text-center">
        <Button asChild variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
          <Link href="/dashboard/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            Start Fresh with New Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Fill out a new questionnaire and get a brand new sleep plan.
        </p>
      </div>
    </div>
  )
}
