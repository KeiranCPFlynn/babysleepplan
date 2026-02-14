import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Baby, FileText, Plus, BookOpen, CreditCard, Moon, Star, Heart, Sparkles } from 'lucide-react'
import { DeleteIntakeButton } from './delete-intake-button'
import { getDaysRemaining, getSubscriptionLabel, hasActiveSubscription } from '@/lib/subscription'
import { SubscriptionStatusDebug } from '@/components/subscription/subscription-status-debug'
import { TestSubscriptionControls } from '@/components/subscription/test-subscription-controls'
import { DeleteUserControls } from '@/components/admin/delete-user-controls'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { formatUniversalDate } from '@/lib/date-format'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get babies (used for count + admin seed controls)
  const { data: babies, count: babyCount } = await supabase
    .from('babies')
    .select('id, name', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { count: planCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const shouldShowAdminTestControls = process.env.NODE_ENV !== 'production' && profile?.is_admin === true

  const { data: adminPlanOptions } = shouldShowAdminTestControls
    ? await supabase
        .from('plans')
        .select('id, status, created_at, baby:babies(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const subscriptionStatus = profile?.subscription_status

  // Get recent plans
  const { data: recentPlans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get completed plans for daily diary prompt
  const { data: completedPlans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  const toIsoDate = (value: Date) => value.toISOString().split('T')[0]
  const today = new Date()
  const todayStr = toIsoDate(today)
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay())
  const currentWeekStartStr = toIsoDate(currentWeekStart)
  const currentWeekEnd = new Date(currentWeekStart)
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6)
  const currentWeekEndStr = toIsoDate(currentWeekEnd)
  const last7Start = new Date(today)
  last7Start.setDate(today.getDate() - 6)
  const last7StartStr = toIsoDate(last7Start)
  const entryWindowStart = currentWeekStartStr < last7StartStr ? currentWeekStartStr : last7StartStr

  const completedPlanIds = (completedPlans || []).map((plan) => plan.id)
  const [{ data: relevantDiaryEntries }, { data: currentWeekReviews }, { data: currentWeekUpdates }] =
    completedPlanIds.length > 0
      ? await Promise.all([
          supabase
            .from('sleep_diary_entries')
            .select('plan_id, date')
            .eq('user_id', user.id)
            .in('plan_id', completedPlanIds)
            .gte('date', entryWindowStart)
            .lte('date', todayStr),
          supabase
            .from('weekly_reviews')
            .select('plan_id')
            .eq('user_id', user.id)
            .in('plan_id', completedPlanIds)
            .eq('week_start', currentWeekStartStr),
          supabase
            .from('plan_revisions')
            .select('plan_id')
            .eq('user_id', user.id)
            .in('plan_id', completedPlanIds)
            .eq('source', 'weekly-review')
            .eq('week_start', last7StartStr),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }]

  const entriesByPlan = new Map<string, Set<string>>()
  for (const entry of (relevantDiaryEntries || []) as Array<{ plan_id: string; date: string }>) {
    const existingDates = entriesByPlan.get(entry.plan_id) || new Set<string>()
    existingDates.add(entry.date)
    entriesByPlan.set(entry.plan_id, existingDates)
  }

  const todaysEntryPlanIds = new Set(
    completedPlanIds.filter((planId) => entriesByPlan.get(planId)?.has(todayStr))
  )

  const reviewReadyPlanIds = new Set(
    ((currentWeekReviews || []) as Array<{ plan_id: string }>).map((review) => review.plan_id)
  )
  const updatedForLast7PlanIds = new Set(
    ((currentWeekUpdates || []) as Array<{ plan_id: string }>).map((update) => update.plan_id)
  )

  const readyCheckins = (completedPlans || [])
    .map((plan) => {
      const entryDates = entriesByPlan.get(plan.id) || new Set<string>()
      let currentWeekEntryCount = 0
      let last7EntryCount = 0

      entryDates.forEach((date) => {
        if (date >= currentWeekStartStr && date <= currentWeekEndStr) {
          currentWeekEntryCount += 1
        }
        if (date >= last7StartStr && date <= todayStr) {
          last7EntryCount += 1
        }
      })

      const reviewReady = currentWeekEntryCount >= 3 && !reviewReadyPlanIds.has(plan.id)
      const updateReady = last7EntryCount >= 7 && !updatedForLast7PlanIds.has(plan.id)

      return {
        planId: plan.id,
        babyName: plan.baby?.name || 'Baby',
        reviewReady,
        updateReady,
      }
    })
    .filter((item) => item.reviewReady || item.updateReady)

  // Get draft intakes that don't already have a plan
  const { data: allDraftIntakes } = await supabase
    .from('intake_submissions')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(10)

  const draftIntakeIds = (allDraftIntakes || []).map((i) => i.id)
  const { data: plansForDrafts } = draftIntakeIds.length > 0
    ? await supabase
        .from('plans')
        .select('intake_submission_id')
        .in('intake_submission_id', draftIntakeIds)
    : { data: [] }

  const intakeIdsWithPlans = new Set((plansForDrafts || []).map((p) => p.intake_submission_id))
  const draftIntakes = (allDraftIntakes || []).filter((i) => !intakeIdsWithPlans.has(i.id)).slice(0, 3)

  const isActive = hasActiveSubscription(subscriptionStatus, isStripeEnabled)
  const daysRemaining = getDaysRemaining(profile?.subscription_period_end ?? null)
  const subscriptionHref = isActive ? '/dashboard/subscription' : '/dashboard/intake/new'

  return (
    <div className="space-y-8">
      <div className="relative">
        {/* Floating decorative icons */}
        <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
          <Moon className="absolute -top-2 left-[5%] h-7 w-7 text-sky-300/40 float-gentle" style={{ animationDelay: '0s' }} />
          <Star className="absolute top-4 right-[5%] h-6 w-6 text-amber-300/40 float-drift" style={{ animationDelay: '1s' }} />
          <Heart className="absolute bottom-0 left-[3%] h-5 w-5 text-rose-300/40 float-orbit" style={{ animationDelay: '0.5s' }} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-slate-500">
          Manage your babies and sleep plans from here.
        </p>
      </div>

      {/* Stats — clickable cards */}
      <AnimateOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/babies" className="group">
            <Card className="bg-white/70 backdrop-blur border-white/60 transition-all card-hover group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Babies</CardTitle>
                <Baby className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{babyCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {babyCount === 1 ? 'Baby registered' : 'Babies registered'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/plans" className="group">
            <Card className="bg-white/70 backdrop-blur border-white/60 transition-all card-hover group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Plans</CardTitle>
                <FileText className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{planCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {planCount === 1 ? 'Plan created' : 'Plans created'}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={subscriptionHref} className="group">
            <Card className="bg-white/70 backdrop-blur border-white/60 transition-all card-hover group-hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                <CreditCard className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {getSubscriptionLabel(subscriptionStatus)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isActive && daysRemaining !== null
                    ? subscriptionStatus === 'trialing'
                      ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`
                      : `Renews in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                    : isActive
                      ? 'Manage subscription'
                      : profile?.has_used_trial
                        ? 'Resubscribe'
                        : 'Start your free trial'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </AnimateOnScroll>

      {/* Subscription Status Debug (Admin Only, Dev Only) */}
      {process.env.NODE_ENV !== 'production' && isStripeEnabled && profile?.is_admin === true && (
        <SubscriptionStatusDebug
          serverStatus={subscriptionStatus}
          isStripeEnabled={isStripeEnabled}
        />
      )}

      {/* Admin Test Controls (Dev Only) */}
      {shouldShowAdminTestControls && <TestSubscriptionControls babies={babies || []} plans={adminPlanOptions || []} />}

      {/* Admin Delete User (Dev Only) */}
      {process.env.NODE_ENV !== 'production' && profile?.is_admin === true && <DeleteUserControls />}

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-sky-700 hover:bg-sky-800 cta-bounce">
          <Link href="/dashboard/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Link>
        </Button>
        <Button variant="outline" asChild className="border-white/60 bg-white/50 backdrop-blur text-slate-700 hover:bg-white/70">
          <Link href="/dashboard/babies/new">
            <Baby className="mr-2 h-4 w-4" />
            Add Baby
          </Link>
        </Button>
      </div>

      {/* Daily diary prompt */}
      {completedPlans && completedPlans.length > 0 && (
        <Card className="border-white/60 bg-gradient-to-br from-sky-50/80 via-white/70 to-rose-50/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-sky-800">
              Log today&apos;s sleep
            </CardTitle>
            <CardDescription className="text-slate-500">
              Choose a plan to log today&apos;s entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedPlans.map((plan) => {
              const hasEntry = todaysEntryPlanIds.has(plan.id)
              return (
                <div key={plan.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/70 backdrop-blur px-4 py-3 border border-white/60">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {plan.baby?.name || 'Baby'}&apos;s Plan
                    </p>
                    <p className="text-xs text-slate-500">
                      {hasEntry ? 'Logged today' : 'Not logged yet'}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant={hasEntry ? 'outline' : 'default'}
                    className={hasEntry ? '' : 'bg-sky-700 hover:bg-sky-800'}
                  >
                    <Link href={`/dashboard/plans/${plan.id}/diary?date=${todayStr}`}>
                      {hasEntry ? 'View / Edit' : 'Log Today'}
                    </Link>
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Check-ins ready */}
      {readyCheckins.length > 0 && (
        <Card className="border-white/60 bg-gradient-to-br from-violet-50/80 via-white/70 to-emerald-50/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Reviews & Updates Ready
            </CardTitle>
            <CardDescription className="text-slate-500">
              Take the next best action for each plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readyCheckins.map((item) => (
              <div
                key={item.planId}
                className="flex flex-col gap-3 rounded-lg bg-white/70 backdrop-blur px-4 py-3 border border-white/60"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.babyName}&apos;s Plan</p>
                  <p className="text-xs text-slate-500">
                    {item.reviewReady && item.updateReady
                      ? '3-day review and 7-day update are both ready.'
                      : item.reviewReady
                        ? '3-day review is ready.'
                        : '7-day update is ready.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.reviewReady && (
                    <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
                      <Link href={`/dashboard/plans/${item.planId}/diary`}>
                        Generate 3-Day Review
                      </Link>
                    </Button>
                  )}
                  {item.updateReady && (
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Link href={`/dashboard/plans/${item.planId}/diary`}>
                        Apply 7-Day Update
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Draft intakes */}
      {draftIntakes && draftIntakes.length > 0 && (
        <AnimateOnScroll>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Continue Your Questionnaire</h2>
            <div className="space-y-4">
              {draftIntakes.map((intake) => (
                <Card key={intake.id} className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div>
                        <CardTitle>{intake.baby?.name || 'Unknown Baby'}&apos;s Questionnaire</CardTitle>
                        <CardDescription>
                          Last updated {formatUniversalDate(intake.updated_at)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In Progress
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/intake/${intake.id}`}>
                            Continue
                          </Link>
                        </Button>
                        <DeleteIntakeButton
                          intakeId={intake.id}
                          babyName={intake.baby?.name || 'Unknown Baby'}
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      )}

      {/* Recent plans */}
      {recentPlans && recentPlans.length > 0 && (
        <AnimateOnScroll>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Recent Plans</h2>
            <div className="space-y-4">
              {recentPlans.map((plan) => (
                <Card key={plan.id} className="bg-white/70 backdrop-blur border-white/60 card-hover">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div>
                        <CardTitle>{plan.baby?.name || 'Baby'}&apos;s Sleep Plan</CardTitle>
                        <CardDescription>
                          Created {formatUniversalDate(plan.created_at)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : plan.status === 'generating'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                            }`}
                        >
                          {plan.status}
                        </span>
                        {plan.status === 'completed' && (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/plans/${plan.id}/diary`}>
                              <BookOpen className="mr-1 h-3 w-3" />
                              Diary
                            </Link>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/plans/${plan.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </AnimateOnScroll>
      )}

      {/* No plans message */}
      {(!recentPlans || recentPlans.length === 0) && (
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-rose-50 backdrop-blur">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription className="text-slate-600">
              {babyCount === 0
                ? "Create your personalized sleep plan in 3 easy steps: Add your baby's info, answer a few questions about their sleep, and get your custom plan."
                : "You haven't created any sleep plans yet. Answer a few questions about your baby's sleep to get personalized guidance."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg" className="bg-sky-700 hover:bg-sky-800 cta-bounce">
              <Link href="/dashboard/intake/new">
                {babyCount === 0 ? 'Get Started' : 'Create Your First Plan'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
