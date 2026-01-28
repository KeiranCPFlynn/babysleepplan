'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fallingAsleepMethods, type IntakeFormData } from '@/lib/validations/intake'

// Generate time options
const bedtimeOptions = [
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '21:30', label: '9:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
]

const waketimeOptions = [
  { value: '05:00', label: '5:00 AM' },
  { value: '05:30', label: '5:30 AM' },
  { value: '06:00', label: '6:00 AM' },
  { value: '06:30', label: '6:30 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '07:30', label: '7:30 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '08:30', label: '8:30 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '09:30', label: '9:30 AM' },
  { value: '10:00', label: '10:00 AM' },
]

export function Step2CurrentSleep() {
  const { setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const fallingAsleepMethod = watch('falling_asleep_method')
  const currentBedtime = watch('current_bedtime')
  const currentWaketime = watch('current_waketime')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Night Sleep Schedule</h2>
        <p className="text-gray-600">
          Tell us about your baby's current night sleep routine. We'll ask about naps separately.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Usual Bedtime</Label>
            <Select
              value={currentBedtime || undefined}
              onValueChange={(value) => setValue('current_bedtime', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select bedtime" />
              </SelectTrigger>
              <SelectContent>
                {bedtimeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">When do you start the bedtime routine?</p>
            {errors.current_bedtime && (
              <p className="text-sm text-red-500">{errors.current_bedtime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Usual Morning Wake Time</Label>
            <Select
              value={currentWaketime || undefined}
              onValueChange={(value) => setValue('current_waketime', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select wake time" />
              </SelectTrigger>
              <SelectContent>
                {waketimeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">When does your baby usually wake up for the day?</p>
            {errors.current_waketime && (
              <p className="text-sm text-red-500">{errors.current_waketime.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>How does your baby fall asleep at bedtime?</Label>
          <Select
            value={fallingAsleepMethod || undefined}
            onValueChange={(value) => setValue('falling_asleep_method', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {fallingAsleepMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            What's the main way your baby falls asleep at night?
          </p>
          {errors.falling_asleep_method && (
            <p className="text-sm text-red-500">{errors.falling_asleep_method.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
