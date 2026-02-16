'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import type { IntakeFormData } from '@/lib/validations/intake'

const cryingLevels = [
  { value: 1, label: 'No crying', description: 'I want a completely no-cry approach' },
  { value: 2, label: 'Minimal crying', description: 'A few minutes of fussing is okay' },
  { value: 3, label: 'Some crying', description: 'Short periods of crying are acceptable' },
  { value: 4, label: 'Moderate crying', description: 'I can handle timed check-ins with crying' },
  { value: 5, label: 'Any method', description: 'I\'m open to any approach that works' },
]

export function Step6Preferences() {
  const { register, setValue, control, formState: { errors } } = useFormContext<IntakeFormData>()

  const cryingLevel = useWatch({
    control,
    name: 'crying_comfort_level',
    defaultValue: 3
  }) ?? 3

  const handleSliderChange = useCallback((value: number[]) => {
    setValue('crying_comfort_level', value[0], { shouldDirty: true, shouldValidate: true })
  }, [setValue])

  const currentLevel = cryingLevels.find(l => l.value === cryingLevel) || cryingLevels[2]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Preferences</h2>
        <p className="text-gray-600">
          Understanding your comfort level and constraints helps us create a plan that works for your family.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>How comfortable are you with your baby crying during sleep training?</Label>
          <div className="px-2">
            <Slider
              value={[cryingLevel]}
              onValueChange={handleSliderChange}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>No crying</span>
              <span>Any method</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">{currentLevel.label}</p>
            <p className="text-sm text-blue-700">{currentLevel.description}</p>
          </div>
          <p className="text-sm text-gray-500">
            We&apos;ll tailor methods to match your comfort level. There&apos;s no wrong answer.
          </p>
          {errors.crying_comfort_level && (
            <p className="text-sm text-red-500">{errors.crying_comfort_level.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="parent_constraints">Any constraints or special circumstances?</Label>
          <Textarea
            id="parent_constraints"
            {...register('parent_constraints')}
            placeholder="e.g., Partner works night shifts, live in apartment with thin walls, older sibling in the house, traveling soon..."
            rows={4}
          />
          <p className="text-sm text-gray-500">
            Tell us about anything that might affect how you implement a sleep plan.
          </p>
          {errors.parent_constraints && (
            <p className="text-sm text-red-500">{errors.parent_constraints.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
