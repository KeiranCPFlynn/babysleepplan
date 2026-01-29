import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft, Moon, Star } from 'lucide-react'
import { DiaryClient } from './diary-client'

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ id: string }>
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
      />
    </div>
  )
}
