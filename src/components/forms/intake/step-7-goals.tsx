'use client'

import { useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { successGoalOptions, type IntakeFormData } from '@/lib/validations/intake'

const OTHER_PREFIX_PATTERN = /^other:\s*/i

function isOtherGoalValue(goal: string, knownGoalValues: Set<string>) {
  const normalized = goal.trim()
  if (!normalized) return false
  if (normalized.toLowerCase() === 'other') return true
  if (OTHER_PREFIX_PATTERN.test(normalized)) return true
  return !knownGoalValues.has(normalized)
}

function extractOtherGoalText(goal: string) {
  const normalized = goal.trim()
  if (!normalized || normalized.toLowerCase() === 'other') return ''
  if (OTHER_PREFIX_PATTERN.test(normalized)) return normalized.replace(OTHER_PREFIX_PATTERN, '')
  return normalized
}

export function Step7Goals() {
  const { register, setValue, control, formState: { errors } } = useFormContext<IntakeFormData>()
  const selectedGoalsValue = useWatch({
    control,
    name: 'success_goals',
    defaultValue: []
  })
  const selectedGoals = useMemo(
    () => Array.isArray(selectedGoalsValue)
      ? selectedGoalsValue.filter((goal): goal is string => typeof goal === 'string')
      : [],
    [selectedGoalsValue]
  )

  const knownGoalValues = useMemo(
    () => new Set(successGoalOptions.map(option => option.value)),
    []
  )

  const selectedOtherGoal = useMemo(
    () => selectedGoals.find(goal => isOtherGoalValue(goal, knownGoalValues)),
    [selectedGoals, knownGoalValues]
  )

  const isGoalSelected = useCallback(
    (goal: string) => selectedGoals.includes(goal),
    [selectedGoals]
  )

  const toggleGoal = useCallback((goal: string) => {
    const updatedGoals = selectedGoals.includes(goal)
      ? selectedGoals.filter(item => item !== goal)
      : [...selectedGoals, goal]

    setValue('success_goals', updatedGoals, { shouldDirty: true, shouldValidate: true })
  }, [selectedGoals, setValue])

  const toggleOtherGoal = useCallback(() => {
    const updatedWithoutOther = selectedGoals.filter(goal => !isOtherGoalValue(goal, knownGoalValues))
    const updatedGoals = selectedOtherGoal
      ? updatedWithoutOther
      : [...updatedWithoutOther, 'other']

    setValue('success_goals', updatedGoals, { shouldDirty: true, shouldValidate: true })
  }, [selectedGoals, selectedOtherGoal, knownGoalValues, setValue])

  const handleOtherGoalTextChange = useCallback((text: string) => {
    const updatedWithoutOther = selectedGoals.filter(goal => !isOtherGoalValue(goal, knownGoalValues))
    const customGoal = text ? `other: ${text}` : 'other'
    setValue('success_goals', [...updatedWithoutOther, customGoal], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }, [selectedGoals, knownGoalValues, setValue])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sky-900">Your Goals</h2>
        <p className="text-slate-600">
          What does sleep success look like for your family?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Select all goals that matter most <span className="text-red-500">*</span></Label>
          <div className="grid gap-3">
            {successGoalOptions.map((goalOption) => {
              const isSelected = isGoalSelected(goalOption.value)
              return (
                <button
                  key={goalOption.value}
                  type="button"
                  onClick={() => toggleGoal(goalOption.value)}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors text-left w-full ${
                    isSelected ? 'bg-sky-50/70 border-sky-300' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className={`flex items-center justify-center w-5 h-5 rounded border mt-0.5 shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">
                      {goalOption.label}
                    </span>
                  </div>
                </button>
              )
            })}

            <button
              type="button"
              onClick={toggleOtherGoal}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors text-left w-full ${
                selectedOtherGoal ? 'bg-sky-50/70 border-sky-300' : 'hover:bg-slate-50/70'
              }`}
            >
              <div className={`flex items-center justify-center w-5 h-5 rounded border mt-0.5 shrink-0 ${
                selectedOtherGoal
                  ? 'bg-sky-600 border-sky-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}>
                {selectedOtherGoal && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium block">
                  Other (please specify)
                </span>
              </div>
            </button>
          </div>
          {selectedOtherGoal && (
            <Input
              value={extractOtherGoalText(selectedOtherGoal)}
              onChange={(e) => handleOtherGoalTextChange(e.target.value)}
              placeholder="Describe your sleep goal..."
            />
          )}
          <p className="text-sm text-slate-500">
            Choose every outcome you want this plan to optimize for.
          </p>
          {errors.success_goals && (
            <p className="text-sm text-red-500">{errors.success_goals.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional_notes">Anything else we should know?</Label>
          <Textarea
            id="additional_notes"
            {...register('additional_notes')}
            placeholder="Any other information that might help us create the perfect sleep plan for your baby..."
            rows={4}
          />
          <p className="text-sm text-slate-500">
            Share any additional context, concerns, or questions you have.
          </p>
          {errors.additional_notes && (
            <p className="text-sm text-red-500">{errors.additional_notes.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
