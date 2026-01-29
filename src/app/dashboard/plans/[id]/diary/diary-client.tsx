'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DiaryEntryForm } from '@/components/diary/diary-entry-form'
import { Calendar, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import type { SleepDiaryEntry, WeeklyReview } from '@/types/database.types'

interface DiaryClientProps {
  planId: string
  babyName: string
  initialEntries: SleepDiaryEntry[]
  initialReviews: WeeklyReview[]
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
}: DiaryClientProps) {
  const [entries, setEntries] = useState<SleepDiaryEntry[]>(initialEntries)
  const [reviews, setReviews] = useState<WeeklyReview[]>(initialReviews)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [generatingReview, setGeneratingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

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

  // Get entry for a specific date
  const getEntryForDate = (date: string) => {
    return entries.find((e) => e.date === date)
  }

  // Check how many days are logged this week
  const weekEntries = weekDates
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
  const generateReview = async () => {
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
                const canEdit = !isFuture && !tooOld

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

      {/* Weekly Review Section */}
      {!selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold text-gray-800">Weekly Review</h3>
              </div>
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
            </div>
          </CardHeader>
          <CardContent>
            {reviewError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mb-4">
                {reviewError}
              </p>
            )}

            {currentWeekReview ? (
              <div className="prose prose-sm max-w-none">
                <p className="text-xs text-gray-500 mb-3">
                  Generated {new Date(currentWeekReview.created_at).toLocaleDateString()}
                </p>
                {currentWeekReview.review_content.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
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
    </div>
  )
}
