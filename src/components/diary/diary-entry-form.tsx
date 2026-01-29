'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loader2, Minus, Plus } from 'lucide-react'
import type { SleepDiaryEntry, DiaryMood } from '@/types/database.types'

interface DiaryEntryFormProps {
  planId: string
  date: string
  existingEntry?: SleepDiaryEntry | null
  onSave: () => void
  onCancel?: () => void
}

const moodOptions: { value: DiaryMood; label: string; color: string }[] = [
  { value: 'great', label: 'Great', color: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'good', label: 'Good', color: 'bg-lime-100 border-lime-300 text-lime-700' },
  { value: 'okay', label: 'Okay', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 'rough', label: 'Rough', color: 'bg-orange-100 border-orange-300 text-orange-700' },
  { value: 'terrible', label: 'Terrible', color: 'bg-red-100 border-red-300 text-red-700' },
]

export function DiaryEntryForm({
  planId,
  date,
  existingEntry,
  onSave,
  onCancel,
}: DiaryEntryFormProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [bedtime, setBedtime] = useState(existingEntry?.bedtime || '')
  const [wakeTime, setWakeTime] = useState(existingEntry?.wake_time || '')
  const [nightWakings, setNightWakings] = useState(existingEntry?.night_wakings || 0)
  const [nightWakingDuration, setNightWakingDuration] = useState(
    existingEntry?.night_waking_duration?.toString() || ''
  )
  const [napCount, setNapCount] = useState(existingEntry?.nap_count || 0)
  const [napTotalMinutes, setNapTotalMinutes] = useState(
    existingEntry?.nap_total_minutes?.toString() || ''
  )
  const [mood, setMood] = useState<DiaryMood | ''>(existingEntry?.mood || '')
  const [notes, setNotes] = useState(existingEntry?.notes || '')

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          date,
          bedtime: bedtime || null,
          wakeTime: wakeTime || null,
          nightWakings,
          nightWakingDuration: nightWakingDuration ? parseInt(nightWakingDuration) : null,
          napCount,
          napTotalMinutes: napTotalMinutes ? parseInt(napTotalMinutes) : 0,
          mood: mood || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.details || data.error || 'Failed to save entry')
      }

      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <h3 className="text-lg font-semibold text-purple-700">
          {formatDateDisplay(date)}
        </h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sleep Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bedtime">Bedtime</Label>
              <Input
                id="bedtime"
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wakeTime">Wake Time</Label>
              <Input
                id="wakeTime"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          {/* Night Wakings */}
          <div className="space-y-2">
            <Label>Night Wakings</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNightWakings(Math.max(0, nightWakings - 1))}
                  disabled={nightWakings === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{nightWakings}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNightWakings(nightWakings + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {nightWakings > 0 && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    placeholder="Total min awake"
                    value={nightWakingDuration}
                    onChange={(e) => setNightWakingDuration(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">min total</span>
                </div>
              )}
            </div>
          </div>

          {/* Naps */}
          <div className="space-y-2">
            <Label>Naps</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNapCount(Math.max(0, napCount - 1))}
                  disabled={napCount === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-medium">{napCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNapCount(napCount + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {napCount > 0 && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    placeholder="Total min"
                    value={napTotalMinutes}
                    onChange={(e) => setNapTotalMinutes(e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">min total</span>
                </div>
              )}
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label>How was the night?</Label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                    mood === option.value
                      ? option.color + ' ring-2 ring-offset-2 ring-purple-400'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Anything noteworthy? Teething, illness, travel, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : existingEntry ? (
                'Update Entry'
              ) : (
                'Save Entry'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
