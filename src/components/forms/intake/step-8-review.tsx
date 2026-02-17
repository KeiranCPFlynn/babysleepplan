'use client'

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  fallingAsleepMethods,
  nightWakingDurations,
  napDurations,
  napLocations,
  successGoalOptions,
  sleepProblems,
  type IntakeFormData,
} from '@/lib/validations/intake'
import type { Baby } from '@/types/database.types'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

interface Step8Props {
  babies: Baby[]
}

const cryingLevels: Record<number, string> = {
  1: 'No crying (completely no-cry approach)',
  2: 'Minimal crying (a few minutes of fussing is okay)',
  3: 'Some crying (short periods acceptable)',
  4: 'Moderate crying (timed check-ins with crying)',
  5: 'Any method (open to any approach)',
}

const OTHER_PREFIX = 'other:'

function getCustomValue(value?: string | null) {
  if (!value) return null
  if (value === 'other') return 'Other'
  if (value.startsWith(OTHER_PREFIX)) {
    const custom = value.slice(OTHER_PREFIX.length).trim()
    return custom || 'Other'
  }
  return null
}

function displaySelectValue(
  value: string | null | undefined,
  options: { value: string; label: string }[]
) {
  if (!value) return 'Not specified'
  const custom = getCustomValue(value)
  if (custom) return custom
  return options.find(option => option.value === value)?.label || value
}

export function Step8Review({ babies }: Step8Props) {
  const { watch } = useFormContext<IntakeFormData>()
  const values = watch()

  const baby = babies.find(b => b.id === values.baby_id)
  const fallingAsleepMethod = displaySelectValue(values.falling_asleep_method, fallingAsleepMethods)
  const nightWakingDuration = displaySelectValue(values.night_waking_duration, nightWakingDurations)
  const napDuration = displaySelectValue(values.nap_duration, napDurations)
  const napMethod = displaySelectValue(values.nap_method, fallingAsleepMethods)
  const napLocation = displaySelectValue(values.nap_location, napLocations)
  const selectedSuccessGoals = Array.isArray(values.success_goals)
    ? values.success_goals
      .filter((goal): goal is string => typeof goal === 'string')
      .map((goal) => displaySelectValue(goal, successGoalOptions))
      .filter(Boolean)
    : []
  const successDescription = displaySelectValue(values.success_description, successGoalOptions)
  const selectedProblems = (values.problems || []).map(
    p => sleepProblems.find(sp => sp.value === p)?.label
  ).filter(Boolean)
  const additionalSleepTimes = Array.isArray(values.additional_sleep_times)
    ? values.additional_sleep_times.filter((time) => time?.bedtime || time?.waketime)
    : []

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sky-900">Review Your Information</h2>
        <p className="text-slate-600">
          Please review the information below before submitting. You can go back to any step to make changes.
        </p>
      </div>

      <div className="space-y-4">
        {/* Baby Info */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Baby Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{baby?.name || 'Not selected'}</p>
          </CardContent>
        </Card>

        {/* Current Sleep */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Current Sleep Situation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Bedtime:</span>{' '}
                <span className="font-medium">{values.current_bedtime || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500">Wake time:</span>{' '}
                <span className="font-medium">{values.current_waketime || 'Not specified'}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-500">Falls asleep by:</span>{' '}
              <span className="font-medium">{fallingAsleepMethod}</span>
            </div>
            {additionalSleepTimes.length > 0 && (
              <div>
                <span className="text-slate-500">Additional sleep periods:</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {additionalSleepTimes.map((time, index) => (
                    <li key={index} className="font-medium">
                      Period {index + 2}:{' '}
                      {time.bedtime ? `Bedtime ${time.bedtime}` : 'Bedtime not specified'}
                      {time.waketime ? `, Wake ${time.waketime}` : ', Wake not specified'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Night Wakings */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Night Wakings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Number of wakings:</span>{' '}
                <span className="font-medium">{values.night_wakings_count ?? 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <span className="font-medium">{nightWakingDuration}</span>
              </div>
            </div>
            {values.night_wakings_description && (
              <div>
                <span className="text-slate-500">Description:</span>{' '}
                <span className="font-medium">{values.night_wakings_description}</span>
              </div>
            )}
            {values.night_waking_pattern && (
              <div>
                <span className="text-slate-500">Pattern:</span>{' '}
                <span className="font-medium">{values.night_waking_pattern}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Naps */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Naps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Naps per day:</span>{' '}
                <span className="font-medium">{values.nap_count ?? 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <span className="font-medium">{napDuration}</span>
              </div>
              <div>
                <span className="text-slate-500">Method:</span>{' '}
                <span className="font-medium">{napMethod}</span>
              </div>
              <div>
                <span className="text-slate-500">Location:</span>{' '}
                <span className="font-medium">{napLocation}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problems */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Sleep Challenges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {selectedProblems.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {selectedProblems.map((problem, i) => (
                  <li key={i} className="font-medium">{problem}</li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No specific challenges selected</p>
            )}
            {values.problem_description && (
              <div className="pt-2">
                <span className="text-slate-500">Details:</span>{' '}
                <span className="font-medium">{values.problem_description}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Crying comfort level:</span>{' '}
              <span className="font-medium">
                {values.crying_comfort_level ? cryingLevels[values.crying_comfort_level] : 'Not specified'}
              </span>
            </div>
            {values.parent_constraints && (
              <div>
                <span className="text-slate-500">Constraints:</span>{' '}
                <span className="font-medium">{values.parent_constraints}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="border-sky-100/70 bg-white/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-sky-900">Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {selectedSuccessGoals.length > 0 && (
              <div>
                <span className="text-slate-500">Success goals:</span>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {selectedSuccessGoals.map((goal, index) => (
                    <li key={index} className="font-medium">{goal}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSuccessGoals.length === 0 && values.success_description && (
              <div>
                <span className="text-slate-500">Success looks like:</span>{' '}
                <span className="font-medium">{successDescription}</span>
              </div>
            )}
            {values.additional_notes && (
              <div>
                <span className="text-slate-500">Additional notes:</span>{' '}
                <span className="font-medium">{values.additional_notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Separator className="my-4" />

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Ready to submit!</p>
          <p className="text-green-700 text-sm">
            {isStripeEnabled
              ? "After you submit, you'll proceed to payment and then receive your personalized sleep plan."
              : "After you submit, we'll generate your personalized sleep plan."}
          </p>
        </div>
      </div>
    </div>
  )
}
