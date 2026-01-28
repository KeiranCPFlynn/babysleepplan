'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Baby } from '@/types/database.types'
import type { IntakeFormData } from '@/lib/validations/intake'

interface Step1Props {
  babies: Baby[]
}

export function Step1Baby({ babies }: Step1Props) {
  const { setValue, watch, formState: { errors } } = useFormContext<IntakeFormData>()
  const babyId = watch('baby_id')

  const selectedBaby = babies.find(b => b.id === babyId)

  // Calculate age
  const getAge = (dob: string) => {
    const birth = new Date(dob)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - birth.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diffDays / 7)
    const months = Math.floor(diffDays / 30.44)
    const years = Math.floor(diffDays / 365.25)

    if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`
    if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`
    return `${weeks} week${weeks > 1 ? 's' : ''} old`
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Which baby is this plan for?</h2>
        <p className="text-gray-600">
          Select the baby you'd like to create a sleep plan for.
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
                  {baby.name} - {getAge(baby.date_of_birth)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.baby_id && (
            <p className="text-sm text-red-500">{errors.baby_id.message}</p>
          )}
        </div>

        {selectedBaby && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{selectedBaby.name}</CardTitle>
              <CardDescription>{getAge(selectedBaby.date_of_birth)}</CardDescription>
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
