'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Baby } from '@/types/database.types'
import type { IntakeFormData } from '@/lib/validations/intake'
import { formatBabyAge } from '@/lib/age'

interface Step1Props {
  babies: Baby[]
}

export function Step1Baby({ babies }: Step1Props) {
  const { setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const babyId = watch('baby_id')

  const selectedBaby = babies.find(b => b.id === babyId)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sky-900">Which baby is this plan for?</h2>
        <p className="text-slate-600">
          Select the baby you&apos;d like to create a sleep plan for.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baby_id">Select Baby</Label>
          <Select
            value={babyId || undefined}
            onValueChange={(value) => setValue('baby_id', value, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a baby" />
            </SelectTrigger>
            <SelectContent>
              {babies.map((baby) => (
                <SelectItem key={baby.id} value={baby.id}>
                  {baby.name} - {formatBabyAge(baby.date_of_birth)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.baby_id && (
            <p className="text-sm text-red-500">{errors.baby_id.message}</p>
          )}
        </div>

        {selectedBaby && (
          <Card className="bg-sky-50/70 border-sky-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-sky-900">{selectedBaby.name}</CardTitle>
              <CardDescription>{formatBabyAge(selectedBaby.date_of_birth)}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {selectedBaby.temperament && (
                <p>
                  <span className="font-medium">Temperament:</span>{' '}
                  {selectedBaby.temperament === 'easy' && 'Easy-going'}
                  {selectedBaby.temperament === 'moderate' && 'Moderate'}
                  {selectedBaby.temperament === 'spirited' && 'Spirited / High needs'}
                </p>
              )}
              {selectedBaby.premature_weeks > 0 && (
                <p>
                  <span className="font-medium">Born:</span>{' '}
                  {selectedBaby.premature_weeks} weeks early
                </p>
              )}
              {selectedBaby.medical_conditions && (
                <p>
                  <span className="font-medium">Notes:</span>{' '}
                  {selectedBaby.medical_conditions}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
