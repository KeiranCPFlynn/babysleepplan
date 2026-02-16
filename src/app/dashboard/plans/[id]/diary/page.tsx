import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Moon, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DiaryClient } from './diary-client'
import { hasActiveSubscription } from '@/lib/subscription'

const THREE_DAY_COOLDOWN_MS = 72 * 60 * 60 * 1000

function diffDaysBetween(start: string | null, end: string | null) {
  if (!start || !end) return null
  const startDate = new Date(start + 'T12:00:00Z')
  const endDate = new Date(end + 'T12:00:00Z')
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
}

function isThreeDayWindowRevision(weekStart: string | null, weekEnd: string | null) {
  return diffDaysBetween(weekStart, weekEnd) === 2
}

export default async function DiaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: { date?: string }
}) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { id } = await params

  // Get plan with baby info
  const { data: plan, error } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name, date_of_birth, temperament)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !plan) {
    notFound()
  }

  if (plan.status !== 'completed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={`/dashboard/plans/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plan
        </Link>
        <div className="text-center py-12">
          <p className="text-gray-600">
            The sleep diary is available once your plan is ready.
          </p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

  if (!hasActiveSubscription(profile?.subscription_status, isStripeEnabled)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={`/dashboard/plans/${id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plan
        </Link>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Subscription Inactive</CardTitle>
            <CardDescription>
              Your subscription is no longer active. The sleep diary requires an active subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">
              Your plan is still available to view.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get diary entries for the past 14 days
  const today = new Date()
  const nowMs = today.getTime()
  const twoWeeksAgo = new Date(today)
  twoWeeksAgo.setDate(today.getDate() - 13)

  const { data: entries } = await supabase
    .from('sleep_diary_entries')
    .select('*')
    .eq('plan_id', id)
    .eq('user_id', user.id)
    .gte('date', twoWeeksAgo.toISOString().split('T')[0])
    .order('date', { ascending: false })

  // Get recent reviews
  const { data: reviews } = await supabase
    .from('weekly_reviews')
    .select('*')
    .eq('plan_id', id)
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(3)

  const last7Start = new Date(today)
  last7Start.setDate(today.getDate() - 6)
  const last7StartStr = last7Start.toISOString().split('T')[0]
  const last3Start = new Date(today)
  last3Start.setDate(today.getDate() - 2)
  const last3StartStr = last3Start.toISOString().split('T')[0]

  const [last3UpdateResult, last7UpdateResult] = await Promise.all([
    supabase
      .from('plan_revisions')
      .select('id')
      .eq('plan_id', id)
      .eq('user_id', user.id)
      .eq('source', 'weekly-review')
      .eq('week_start', last3StartStr)
      .maybeSingle(),
    supabase
      .from('plan_revisions')
      .select('id')
      .eq('plan_id', id)
      .eq('user_id', user.id)
      .eq('source', 'weekly-review')
      .eq('week_start', last7StartStr)
      .maybeSingle(),
  ])

  const { data: recentUpdates } = await supabase
    .from('plan_revisions')
    .select('created_at, week_start, week_end')
    .eq('plan_id', id)
    .eq('user_id', user.id)
    .eq('source', 'weekly-review')
    .order('created_at', { ascending: false })
    .limit(20)

  const last3Update = last3UpdateResult.data
  const last7Update = last7UpdateResult.data
  const latestThreeDayUpdate = (recentUpdates || []).find((revision) =>
    isThreeDayWindowRevision(revision.week_start, revision.week_end)
  )
  const threeDayCooldownUntil = latestThreeDayUpdate?.created_at
    ? new Date(new Date(latestThreeDayUpdate.created_at).getTime() + THREE_DAY_COOLDOWN_MS)
    : null
  const initialThreeDayCooldownUntil = threeDayCooldownUntil && nowMs < threeDayCooldownUntil.getTime()
    ? threeDayCooldownUntil.toISOString()
    : null

  const preselectDate = searchParams?.date

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={`/dashboard/plans/${id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Plan
      </Link>

      {/* Header */}
      <div className="bg-purple-100 rounded-2xl px-6 py-6 text-center">
        <div className="flex justify-center gap-2 mb-3">
          <Star className="h-4 w-4 text-pink-400" />
          <Moon className="h-5 w-5 text-purple-500" />
          <Star className="h-4 w-4 text-pink-400" />
        </div>
        <h1 className="text-2xl font-bold text-purple-700">
          {plan.baby?.name}&apos;s Sleep Diary
        </h1>
        <p className="text-purple-600 text-sm mt-1">
          Track sleep patterns and get weekly insights
        </p>
      </div>

      <DiaryClient
        planId={id}
        babyName={plan.baby?.name || 'Baby'}
        initialEntries={entries || []}
        initialReviews={reviews || []}
        initialSelectedDate={preselectDate || null}
        initialThreeDayCooldownUntil={initialThreeDayCooldownUntil}
        initialUpdatedForLast3={Boolean(last3Update)}
        initialUpdatedForLast7={Boolean(last7Update)}
      />
    </div>
  )
}
