'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
          Tell us about your baby's daytime sleep.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nap_count">How many naps per day?</Label>
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

        <div className="space-y-2">
          <Label htmlFor="nap_duration">How long are the naps?</Label>
          <Select
            value={napDuration || undefined}
            onValueChange={(value) => setValue('nap_duration', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {napDurations.map((duration) => (
                <SelectItem key={duration.value} value={duration.value}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            On average, how long do naps usually last?
          </p>
          {errors.nap_duration && (
            <p className="text-sm text-red-500">{errors.nap_duration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nap_method">How does your baby fall asleep for naps?</Label>
          <Select
            value={napMethod || undefined}
            onValueChange={(value) => setValue('nap_method', value, { shouldDirty: true })}
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
            How does your baby usually fall asleep for naps?
          </p>
          {errors.nap_method && (
            <p className="text-sm text-red-500">{errors.nap_method.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nap_location">Where does your baby nap?</Label>
          <Select
            value={napLocation || undefined}
            onValueChange={(value) => setValue('nap_location', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {napLocations.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Where does your baby usually take naps?
          </p>
          {errors.nap_location && (
            <p className="text-sm text-red-500">{errors.nap_location.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
