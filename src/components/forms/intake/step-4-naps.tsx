'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SelectWithOther } from '@/components/ui/select-with-other'
import { napDurations, napLocations, fallingAsleepMethods, type IntakeFormData } from '@/lib/validations/intake'

export function Step4Naps() {
  const { register, setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const napDuration = watch('nap_duration')
  const napMethod = watch('nap_method')
  const napLocation = watch('nap_location')

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Naps</h2>
        <p className="text-gray-600">
          Tell us about your baby&apos;s daytime sleep.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nap_count">How many naps per day? <span className="text-red-500">*</span></Label>
          <Input
            id="nap_count"
            type="number"
            min="0"
            max="10"
            {...register('nap_count', { valueAsNumber: true })}
            placeholder="0"
          />
          <p className="text-sm text-gray-500">On a typical day, how many naps does your baby take?</p>
          {errors.nap_count && (
            <p className="text-sm text-red-500">{errors.nap_count.message}</p>
          )}
        </div>

        <SelectWithOther
          label="How long are the naps?"
          description="On average, how long do naps usually last? Use Other if they vary a lot."
          options={napDurations}
          value={napDuration}
          onChange={(value) => setValue('nap_duration', value, { shouldDirty: true })}
          placeholder="Select duration"
          otherPlaceholder="Describe nap duration (e.g., 'morning nap 1.5hrs, afternoon 30min')..."
          error={errors.nap_duration?.message}
        />

        <SelectWithOther
          label="How does your baby fall asleep for naps?"
          description="How does your baby usually fall asleep for naps?"
          options={fallingAsleepMethods}
          value={napMethod}
          onChange={(value) => setValue('nap_method', value, { shouldDirty: true })}
          placeholder="Select method"
          otherPlaceholder="Describe how your baby falls asleep for naps..."
          error={errors.nap_method?.message}
        />

        <SelectWithOther
          label="Where does your baby nap?"
          description="Where does your baby usually take naps?"
          options={napLocations}
          value={napLocation}
          onChange={(value) => setValue('nap_location', value, { shouldDirty: true })}
          placeholder="Select location"
          otherPlaceholder="Describe where your baby naps..."
          error={errors.nap_location?.message}
        />
      </div>
    </div>
  )
}
