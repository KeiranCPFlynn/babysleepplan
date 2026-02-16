import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import { hasActiveSubscription } from '@/lib/subscription'
import { SubscriptionStatusDebug } from '@/components/subscription/subscription-status-debug'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function DiaryHubPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: completedPlans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const subscriptionStatus = profile?.subscription_status
  const isActive = hasActiveSubscription(subscriptionStatus, isStripeEnabled)

  const todayStr = new Date().toISOString().split('T')[0]
  if (isActive && completedPlans && completedPlans.length === 1) {
    redirect(`/dashboard/plans/${completedPlans[0].id}/diary?date=${todayStr}`)
  }

  const planIds = isActive ? (completedPlans || []).map((plan) => plan.id) : []
  const { data: todaysEntries } = planIds.length > 0
    ? await supabase
      .from('sleep_diary_entries')
      .select('plan_id')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .in('plan_id', planIds)
    : { data: [] }
  const todaysEntryPlanIds = new Set((todaysEntries || []).map((entry) => entry.plan_id))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-purple-900">Sleep Diary</h1>
        <p className="text-purple-600/80 mt-1">
          Choose a plan to log today&apos;s sleep or review past entries.
        </p>
      </div>

      {/* Subscription Status Debug (Development Only) */}
      {isStripeEnabled && process.env.NODE_ENV !== 'production' && (
        <SubscriptionStatusDebug
          serverStatus={subscriptionStatus}
          isStripeEnabled={isStripeEnabled}
        />
      )}

      {isActive && completedPlans && completedPlans.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {completedPlans.map((plan) => {
            const hasEntry = todaysEntryPlanIds.has(plan.id)
            return (
              <Card key={plan.id} className="border-purple-100">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-800">
                    {plan.baby?.name || 'Baby'}&apos;s Diary
                  </CardTitle>
                  <CardDescription>
                    {hasEntry ? 'Logged today' : 'Not logged yet'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className={hasEntry ? '' : 'bg-purple-600 hover:bg-purple-700'}>
                    <Link href={`/dashboard/plans/${plan.id}/diary?date=${todayStr}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      {hasEntry ? 'View / Edit' : 'Log Today'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : !isActive && completedPlans && completedPlans.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Subscription Inactive</CardTitle>
            <CardDescription>
              Your subscription is no longer active. The sleep diary requires an active subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">
              Your plans are still available to view.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No plans yet</CardTitle>
            <CardDescription>
              You&apos;ll be able to use the diary once a sleep plan is completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard/intake/new">Create a Plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
