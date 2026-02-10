'use client'

import { useFormContext, useFieldArray } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { TimePicker } from '@/components/ui/time-picker'
import { SelectWithOther } from '@/components/ui/select-with-other'
import { Plus, X } from 'lucide-react'
import { fallingAsleepMethods, type IntakeFormData } from '@/lib/validations/intake'

export function Step2CurrentSleep() {
  const { control, setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const fallingAsleepMethod = watch('falling_asleep_method')
  const currentBedtime = watch('current_bedtime')
  const currentWaketime = watch('current_waketime')
  const additionalSleepTimes = watch('additional_sleep_times')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additional_sleep_times',
  })

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Night Sleep Schedule</h2>
        <p className="text-gray-600">
          Tell us about your baby&apos;s current night sleep routine. We&apos;ll ask about naps separately.
        </p>
      </div>

      <div className="space-y-4">
        {/* Primary sleep times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedtime">Usual Bedtime <span className="text-red-500">*</span></Label>
            <TimePicker
              id="bedtime"
              value={currentBedtime}
              onChange={(val) => setValue('current_bedtime', val, { shouldDirty: true })}
            />
            <p className="text-sm text-gray-500">When do you start the bedtime routine?</p>
            {errors.current_bedtime && (
              <p className="text-sm text-red-500">{errors.current_bedtime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="waketime">Usual Morning Wake Time <span className="text-red-500">*</span></Label>
            <TimePicker
              id="waketime"
              value={currentWaketime}
              onChange={(val) => setValue('current_waketime', val, { shouldDirty: true })}
            />
            <p className="text-sm text-gray-500">When does your baby usually wake up for the day?</p>
            {errors.current_waketime && (
              <p className="text-sm text-red-500">{errors.current_waketime.message}</p>
            )}
          </div>
        </div>

        {/* Additional sleep times */}
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={() => remove(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="space-y-2">
              <Label>Additional Bedtime {index + 2}</Label>
              <TimePicker
                value={additionalSleepTimes?.[index]?.bedtime}
                onChange={(val) => setValue(`additional_sleep_times.${index}.bedtime`, val, { shouldDirty: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Wake Time {index + 2}</Label>
              <TimePicker
                value={additionalSleepTimes?.[index]?.waketime}
                onChange={(val) => setValue(`additional_sleep_times.${index}.waketime`, val, { shouldDirty: true })}
              />
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ bedtime: '', waketime: '' })}
          className="text-gray-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add another sleep period
        </Button>
        <p className="text-xs text-gray-500">
          Use this if your baby has multiple distinct sleep periods (e.g., split nights)
        </p>

        <SelectWithOther
          label="How does your baby fall asleep at bedtime? *"
          description="What's the main way your baby falls asleep at night?"
          options={fallingAsleepMethods}
          value={fallingAsleepMethod}
          onChange={(value) => setValue('falling_asleep_method', value, { shouldDirty: true })}
          placeholder="Select method"
          otherPlaceholder="Describe how your baby falls asleep..."
          error={errors.falling_asleep_method?.message}
        />
      </div>
    </div>
  )
}
