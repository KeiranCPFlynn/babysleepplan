'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { nightWakingDurations, type IntakeFormData } from '@/lib/validations/intake'

export function Step3NightWakings() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const nightWakingDuration = watch('night_waking_duration')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Night Wakings</h2>
        <p className="text-gray-600">
          Tell us about how your baby sleeps through the night.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="night_wakings_count">How many times does your baby wake at night?</Label>
          <Input
            id="night_wakings_count"
            type="number"
            min="0"
            max="20"
            {...register('night_wakings_count', { valueAsNumber: true })}
            placeholder="0"
          />
          <p className="text-sm text-gray-500">On a typical night, how many times do they wake?</p>
          {errors.night_wakings_count && (
            <p className="text-sm text-red-500">{errors.night_wakings_count.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="night_waking_duration">How long are the wakings?</Label>
          <Select
            value={nightWakingDuration || undefined}
            onValueChange={(value) => setValue('night_waking_duration', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {nightWakingDurations.map((duration) => (
                <SelectItem key={duration.value} value={duration.value}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            On average, how long does it take to get your baby back to sleep?
          </p>
          {errors.night_waking_duration && (
            <p className="text-sm text-red-500">{errors.night_waking_duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="night_wakings_description">What happens during wakings?</Label>
          <Textarea
            id="night_wakings_description"
            {...register('night_wakings_description')}
            placeholder="e.g., They wake up crying and need to be fed/rocked back to sleep..."
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Describe what typically happens when your baby wakes at night.
          </p>
          {errors.night_wakings_description && (
            <p className="text-sm text-red-500">{errors.night_wakings_description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="night_waking_pattern">Is there a pattern to the wakings?</Label>
          <Textarea
            id="night_waking_pattern"
            {...register('night_waking_pattern')}
            placeholder="e.g., Always wakes at 2am, wakes every 2-3 hours, more frequent in second half of night..."
            rows={3}
          />
          <p className="text-sm text-gray-500">
            Any patterns you've noticed (times, frequency, triggers)?
          </p>
          {errors.night_waking_pattern && (
            <p className="text-sm text-red-500">{errors.night_waking_pattern.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
