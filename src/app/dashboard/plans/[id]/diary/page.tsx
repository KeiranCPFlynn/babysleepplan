import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Moon, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DiaryClient } from './diary-client'
import { hasActiveSubscription } from '@/lib/subscription'

export default async function DiaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: { date?: string; autoReview?: string; autoUpdate7?: string }
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
  const { data: last7Update } = await supabase
      .from('plan_revisions')
      .select('id')
      .eq('plan_id', id)
      .eq('user_id', user.id)
      .eq('source', 'weekly-review')
      .eq('week_start', last7StartStr)
      .maybeSingle()

  const preselectDate = searchParams?.date
  const initialAutoGenerateReview = searchParams?.autoReview === '1' || searchParams?.autoReview === 'true'
  const initialAutoApplySevenDayUpdate = searchParams?.autoUpdate7 === '1' || searchParams?.autoUpdate7 === 'true'

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
          Track sleep patterns and get regular check-ins
        </p>
      </div>

      <DiaryClient
        planId={id}
        babyName={plan.baby?.name || 'Baby'}
        initialEntries={entries || []}
        initialReviews={reviews || []}
        initialSelectedDate={preselectDate || null}
        initialAutoGenerateReview={initialAutoGenerateReview}
        initialAutoApplySevenDayUpdate={initialAutoApplySevenDayUpdate}
        initialUpdatedForLast7={Boolean(last7Update)}
      />
    </div>
  )
}
