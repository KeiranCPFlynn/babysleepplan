'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DiaryEntryForm } from '@/components/diary/diary-entry-form'
import { PlanContent } from '../plan-content'
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import type { SleepDiaryEntry, WeeklyReview } from '@/types/database.types'

interface DiaryClientProps {
  planId: string
  babyName: string
  initialEntries: SleepDiaryEntry[]
  initialReviews: WeeklyReview[]
  initialSelectedDate?: string | null
  initialUpdatedForLast7?: boolean
}

const moodColors: Record<string, string> = {
  great: 'bg-green-100 text-green-700',
  good: 'bg-lime-100 text-lime-700',
  okay: 'bg-yellow-100 text-yellow-700',
  rough: 'bg-orange-100 text-orange-700',
  terrible: 'bg-red-100 text-red-700',
}

export function DiaryClient({
  planId,
  babyName,
  initialEntries,
  initialReviews,
  initialSelectedDate = null,
  initialUpdatedForLast7 = false,
}: DiaryClientProps) {
  const [entries, setEntries] = useState<SleepDiaryEntry[]>(initialEntries)
  const [reviews, setReviews] = useState<WeeklyReview[]>(initialReviews)
  const [selectedDate, setSelectedDate] = useState<string | null>(initialSelectedDate)
  const [weekOffset, setWeekOffset] = useState(0)
  const [generatingReview, setGeneratingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [updatingPlan, setUpdatingPlan] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [updatedForLast7, setUpdatedForLast7] = useState(initialUpdatedForLast7)
  const isDevMode = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'false'

  // Calculate week dates based on offset
  const getWeekDates = () => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))

    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  const weekDates = getWeekDates()
  const todayStr = new Date().toISOString().split('T')[0]
  const last7Dates = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return date.toISOString().split('T')[0]
  })

  // Get entry for a specific date
  const getEntryForDate = (date: string) => {
    return entries.find((e) => e.date === date)
  }

  // Check how many days are logged this week
  const weekEntries = weekDates
    .map((d) => getEntryForDate(d))
    .filter(Boolean)

  const last7Entries = last7Dates
    .map((d) => getEntryForDate(d))
    .filter(Boolean)

  // Format date for display
  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      num: date.getDate(),
    }
  }

  // Format week range for display
  const formatWeekRange = () => {
    const start = new Date(weekDates[0] + 'T12:00:00')
    const end = new Date(weekDates[6] + 'T12:00:00')
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Refresh entries from server
  const refreshEntries = async () => {
    try {
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13)

      const response = await fetch(
        `/api/diary?planId=${planId}&startDate=${twoWeeksAgo.toISOString().split('T')[0]}`
      )
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (err) {
      console.error('Failed to refresh entries:', err)
    }
  }

  // Handle save from form
  const handleSave = () => {
    setSelectedDate(null)
    refreshEntries()
  }

  // Generate weekly review
  const requestReview = async () => {
    setGeneratingReview(true)
    setReviewError(null)

    try {
      const response = await fetch('/api/diary/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          weekStart: weekDates[0],
          weekEnd: weekDates[6],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate review')
      }

      // Add new review to state
      setReviews((prev) => [data.review, ...prev.filter(r => r.week_start !== data.review.week_start)])
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to generate review')
    } finally {
      setGeneratingReview(false)
    }
  }

  const generateReview = () => requestReview()
  const regenerateReview = () => requestReview()

  const seedEntries = async (days: number) => {
    setSeeding(true)
    setReviewError(null)
    setUpdateMessage(null)

    try {
      const response = await fetch('/api/diary/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, days }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed entries')
      }

      await refreshEntries()
      setUpdateMessage({ type: 'success', text: `Seeded ${days} days of entries for testing.` })
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to seed entries' })
    } finally {
      setSeeding(false)
    }
  }

  const updatePlan = async (force: boolean = false) => {
    setUpdatingPlan(true)
    setUpdateMessage(null)

    try {
      const response = await fetch(`/api/diary/plan-update${force ? '?force=true' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          weekStart: last7Dates[0],
          weekEnd: last7Dates[6],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update plan')
      }

      setUpdateMessage({ type: 'success', text: 'Plan updated and saved to history.' })
      setUpdatedForLast7(true)
    } catch (err) {
      setUpdateMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update plan' })
    } finally {
      setUpdatingPlan(false)
    }
  }

  // Get review for current week
  const currentWeekReview = reviews.find((r) => r.week_start === weekDates[0])

  // Check if date is in the future
  const isFutureDate = (dateStr: string) => dateStr > todayStr

  // Check if date is more than 7 days ago
  const isTooOld = (dateStr: string) => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return dateStr < sevenDaysAgo.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Log Today CTA */}
      {!selectedDate && !getEntryForDate(todayStr) && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-purple-700">Log Today&apos;s Sleep</h3>
                <p className="text-sm text-purple-600">
                  How did {babyName} sleep last night?
                </p>
              </div>
              <Button
                onClick={() => setSelectedDate(todayStr)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Log Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry Form (when editing) */}
      {selectedDate && (
        <DiaryEntryForm
          planId={planId}
          date={selectedDate}
          existingEntry={getEntryForDate(selectedDate)}
          onSave={handleSave}
          onCancel={() => setSelectedDate(null)}
        />
      )}

      {/* Week View */}
      {!selectedDate && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(weekOffset - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium text-gray-700">{formatWeekRange()}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(weekOffset + 1)}
                disabled={weekOffset >= 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const { day, num } = formatDayLabel(date)
                const entry = getEntryForDate(date)
                const isToday = date === todayStr
                const isFuture = isFutureDate(date)
                const tooOld = isTooOld(date)
                const canEdit = !isFuture && (!tooOld || !!entry)
                const bedWakeSummary = entry
                  ? [
                      entry.bedtime ? `Bed ${entry.bedtime}` : null,
                      entry.wake_time ? `Wake ${entry.wake_time}` : null,
                    ].filter(Boolean).join(' · ')
                  : null

                return (
                  <button
                    key={date}
                    onClick={() => canEdit && setSelectedDate(date)}
                    disabled={!canEdit}
                    className={`
                      flex flex-col items-center p-2 rounded-lg transition-all
                      ${isToday ? 'ring-2 ring-purple-400' : ''}
                      ${isFuture ? 'opacity-40 cursor-not-allowed' : ''}
                      ${tooOld && !entry ? 'opacity-40 cursor-not-allowed' : ''}
                      ${entry ? 'bg-purple-50' : 'bg-gray-50 hover:bg-gray-100'}
                      ${canEdit ? 'cursor-pointer' : ''}
                    `}
                  >
                    <span className="text-xs text-gray-500">{day}</span>
                    <span className={`text-lg font-medium ${isToday ? 'text-purple-600' : 'text-gray-700'}`}>
                      {num}
                    </span>
                    {entry ? (
                      <div className="mt-1 space-y-1 w-full">
                        {entry.mood && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${moodColors[entry.mood]}`}>
                            {entry.mood}
                          </span>
                        )}
                        {entry.night_wakings > 0 && (
                          <span className="text-xs text-gray-500 block">
                            {entry.night_wakings}x wake
                          </span>
                        )}
                        {bedWakeSummary && (
                          <span className="text-[10px] text-gray-500 block leading-tight">
                            {bedWakeSummary}
                          </span>
                        )}
                        {entry.nap_count > 0 && (
                          <span className="text-[10px] text-gray-500 block leading-tight">
                            Naps {entry.nap_count}
                          </span>
                        )}
                      </div>
                    ) : canEdit ? (
                      <span className="text-xs text-gray-400 mt-1">+ log</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7-day Plan Update */}
      {!selectedDate && !updatedForLast7 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <h3 className="font-semibold text-emerald-900">7-Day Plan Update</h3>
            <p className="text-sm text-emerald-700">
              Based on the last 7 days of diary entries.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {last7Entries.length < 7 ? (
              <div>
                <p className="text-sm text-emerald-800">
                  {last7Entries.length}/7 days logged
                </p>
                <p className="text-xs text-emerald-700">
                  Once you log 7 days, you&apos;ll be able to apply a plan update.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-emerald-900">
                    Ready to update the plan
                  </p>
                  <p className="text-xs text-emerald-700">
                    We&apos;ll add a focused update based on the past week.
                  </p>
                </div>
                <Button
                  onClick={() => updatePlan()}
                  disabled={updatingPlan}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {updatingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Plan'
                  )}
                </Button>
              </div>
            )}
            {updateMessage && (
              <p
                className={`text-sm rounded px-3 py-2 ${
                  updateMessage.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {updateMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Weekly Review Section */}
      {!selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Weekly Review</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {weekEntries.length >= 3 && !currentWeekReview && (
                  <Button
                    onClick={generateReview}
                    disabled={generatingReview}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {generatingReview ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Get Review'
                    )}
                  </Button>
                )}
                {isDevMode && currentWeekReview && (
                  <Button
                    onClick={regenerateReview}
                    disabled={generatingReview}
                    size="sm"
                    variant="ghost"
                  >
                    {generatingReview ? 'Regenerating...' : 'Regenerate Review'}
                  </Button>
                )}
                {isDevMode && (
                  <>
                    <Button
                      onClick={() => seedEntries(3)}
                      disabled={seeding}
                      size="sm"
                      variant="ghost"
                    >
                      Seed 3 Days
                    </Button>
                    <Button
                      onClick={() => seedEntries(7)}
                      disabled={seeding}
                      size="sm"
                      variant="ghost"
                    >
                      Seed 7 Days
                    </Button>
                    <Button
                      onClick={() => updatePlan(true)}
                      disabled={updatingPlan || last7Entries.length < 7}
                      size="sm"
                      variant="ghost"
                    >
                      {updatingPlan ? 'Updating...' : 'Force Update'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!currentWeekReview && weekEntries.length >= 3 && (
              <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-medium text-purple-800">
                  This week&apos;s review is ready to generate.
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  We&apos;ll summarize patterns from the diary and highlight wins.
                </p>
              </div>
            )}
            {reviewError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">
                {reviewError}
              </p>
            )}

            {currentWeekReview ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Generated {new Date(currentWeekReview.created_at).toLocaleDateString()}
                </p>
                <PlanContent content={currentWeekReview.review_content} />
                <p className="text-xs text-gray-400">
                  Plan updates unlock after 7 logged days.
                </p>
              </div>
            ) : weekEntries.length < 3 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">
                  Log at least 3 days this week to get your AI review.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {weekEntries.length}/3 days logged
                </p>
              </div>
            ) : generatingReview ? (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">
                  Analyzing {babyName}&apos;s sleep patterns...
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Past Reviews */}
      {!selectedDate && reviews.length > 0 && reviews.some(r => r.week_start !== weekDates[0]) && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-800">Past Reviews</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews
              .filter((r) => r.week_start !== weekDates[0])
              .slice(0, 3)
              .map((review) => (
                <div key={review.id} className="border-l-2 border-purple-200 pl-4">
                  <p className="text-sm font-medium text-gray-700">
                    Week of {new Date(review.week_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                    {review.review_content.split('\n\n')[0]}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Daily Entry Summary */}
      {!selectedDate && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-800">Daily Entries</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-sm text-gray-500">
                No entries yet. Log today&apos;s sleep to get started.
              </p>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {formatFullDate(entry.date)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.bedtime ? `Bed ${entry.bedtime}` : 'Bedtime not set'} ·{' '}
                        {entry.wake_time ? `Wake ${entry.wake_time}` : 'Wake time not set'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(entry.date)}
                    >
                      Edit
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {entry.mood && (
                      <span className={`px-2 py-0.5 rounded ${moodColors[entry.mood]}`}>
                        {entry.mood}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      Night wakings: {entry.night_wakings}
                      {entry.night_waking_duration ? ` (${entry.night_waking_duration} min)` : ''}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      Naps: {entry.nap_count} ({entry.nap_total_minutes} min)
                    </span>
                  </div>

                  {entry.notes && (
                    <p className="text-xs text-gray-500 mt-2">
                      {entry.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
