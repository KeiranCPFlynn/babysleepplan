import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Baby as BabyIcon, CreditCard, Plus, RefreshCw } from 'lucide-react'
import { BabySelector } from './baby-selector'
import { DraftGate } from './draft-gate'
import { formatUniversalDate } from '@/lib/date-format'
import { hasActiveSubscription } from '@/lib/subscription'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function NewIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ baby?: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const params = await searchParams
  const babyId = params.baby

  // Fetch babies
  const { data: babies } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // If no babies, redirect to add baby
  if (!babies || babies.length === 0) {
    redirect('/dashboard/babies/new?returnTo=/dashboard/intake/new')
  }

  // When ?baby= is set, skip gates — user made an intentional choice
  if (babyId) {
    const validBaby = babies.find(b => b.id === babyId)
    if (!validBaby) {
      redirect('/dashboard/intake/new')
    }

    return (
      <div className="dashboard-surface space-y-6 p-5 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold text-sky-900">Create Sleep Plan</h1>
          <p className="text-slate-600 mt-2">
            Setting up your personalized questionnaire...
          </p>
        </div>
        <BabySelector babies={babies} selectedBabyId={babyId} />
      </div>
    )
  }

  // Fetch draft intakes, completed plans, and subscription status for gate logic
  const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
  const [{ data: draftIntake }, { data: completedPlans }, { data: profile }] = await Promise.all([
    supabase
      .from('intake_submissions')
      .select('id, baby_id, updated_at, baby:babies(name)')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('plans')
      .select('id, baby_id, created_at, baby:babies(name)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('subscription_status, trial_ends_at, has_used_trial')
      .eq('id', user.id)
      .single(),
  ])

  const isActive = hasActiveSubscription(profile?.subscription_status, isStripeEnabled, profile?.trial_ends_at)

  // Gate 1: Existing draft — ask to continue or start fresh
  if (draftIntake) {
    const draftBaby = draftIntake.baby as { name: string } | { name: string }[] | null
    const draftBabyName = Array.isArray(draftBaby)
      ? draftBaby[0]?.name || 'Baby'
      : draftBaby?.name || 'Baby'

    return (
      <div className="dashboard-surface max-w-2xl mx-auto space-y-6 p-5 sm:p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-sky-900">Create Sleep Plan</h1>
          <p className="text-slate-600 mt-2">
            You have an unfinished questionnaire.
          </p>
        </div>

        <Card className="dashboard-card-soft border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="text-lg text-amber-900">
              {draftBabyName}&apos;s Questionnaire
            </CardTitle>
            <CardDescription className="text-amber-700">
              Last updated {formatUniversalDate(draftIntake.updated_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DraftGate
              draftId={draftIntake.id}
              draftBabyName={draftBabyName}
              continueHref={`/dashboard/intake/${draftIntake.id}`}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Gate 2: Existing completed plans — offer regenerate or add baby
  if (completedPlans && completedPlans.length > 0) {
    const babiesWithPlan = new Set(completedPlans.map(p => p.baby_id))
    const babiesWithoutPlan = babies.filter(b => !babiesWithPlan.has(b.id))

    return (
      <div className="dashboard-surface max-w-2xl mx-auto space-y-6 p-5 sm:p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-sky-700 hover:text-sky-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-sky-900">Create Sleep Plan</h1>
          <p className="text-slate-600 mt-2">
            You already have a plan. What would you like to do?
          </p>
        </div>

        {!isActive && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-amber-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Required
              </CardTitle>
              <CardDescription className="text-amber-700">
                You need an active subscription to regenerate or create new plans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-sky-700 hover:bg-sky-800">
                <Link href={profile?.has_used_trial ? '/dashboard/resubscribe' : '/dashboard/subscription'}>
                  {profile?.has_used_trial ? 'Resubscribe' : 'Start Your Free Trial'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Babies with existing plans */}
        {completedPlans.map(plan => {
          const planBaby = plan.baby as { name: string } | { name: string }[] | null
          const babyName = Array.isArray(planBaby)
            ? planBaby[0]?.name || 'Baby'
            : planBaby?.name || 'Baby'

          return (
            <Card key={plan.id} className="dashboard-card-soft">
              <CardHeader>
                <CardTitle className="text-lg text-sky-800">
                  {babyName}&apos;s Plan
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Created {formatUniversalDate(plan.created_at)}
                </CardDescription>
              </CardHeader>
              {isActive && (
                <CardContent className="space-y-2">
                  <Button asChild className="bg-sky-700 hover:bg-sky-800">
                    <Link href={`/dashboard/intake/new?baby=${encodeURIComponent(plan.baby_id)}`}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Plan
                    </Link>
                  </Button>
                  <p className="text-xs text-slate-500">
                    Your previous answers will be pre-filled so you can update what&apos;s changed.
                  </p>
                </CardContent>
              )}
            </Card>
          )
        })}

        {/* Babies without plans */}
        {isActive && babiesWithoutPlan.map(baby => (
          <Card key={baby.id} className="dashboard-card-soft border-sky-200">
            <CardHeader>
              <CardTitle className="text-lg text-sky-800">
                {baby.name}
              </CardTitle>
              <CardDescription className="text-slate-500">
                No plan yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-sky-700 hover:bg-sky-800">
                <Link href={`/dashboard/intake/new?baby=${encodeURIComponent(baby.id)}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Plan for {baby.name}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Add new baby option */}
        {isActive && (
          <Card className="border-sky-100/80 bg-gradient-to-br from-sky-50/70 via-white to-rose-50/60">
            <CardContent className="pt-6">
              <Button asChild variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                <Link href="/dashboard/babies/new?returnTo=/dashboard/intake/new">
                  <BabyIcon className="mr-2 h-4 w-4" />
                  Add a New Baby
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // No plans, no drafts — proceed to existing flow
  // Most users have one baby; skip the selector step.
  if (babies.length === 1) {
    redirect(`/dashboard/intake/new?baby=${encodeURIComponent(babies[0].id)}`)
  }

  // Multiple babies, no plans yet — show baby selection
  return (
    <div className="dashboard-surface space-y-6 p-5 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold text-sky-900">Create Sleep Plan</h1>
        <p className="text-slate-600 mt-2">
          Select which baby you&apos;d like to create a personalized sleep plan for.
        </p>
      </div>

      <BabySelector babies={babies} />

      <Card className="border-sky-100/80 bg-gradient-to-br from-sky-50/70 via-white to-rose-50/60">
        <CardContent className="pt-6">
          <p className="text-center text-slate-600">
            Don&apos;t see the right baby?{' '}
            <Link
              href="/dashboard/babies/new?returnTo=/dashboard/intake/new"
              className="text-sky-700 hover:underline"
            >
              Add a new baby
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
