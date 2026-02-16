'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { babySchema, type BabyFormData } from '@/lib/validations/baby'
import { createBaby, updateBaby } from '@/lib/api/babies'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Baby } from '@/types/database.types'

interface BabyFormProps {
  baby?: Baby
  mode: 'create' | 'edit'
  returnTo?: string
}

export function BabyForm({ baby, mode, returnTo }: BabyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BabyFormData>({
    resolver: zodResolver(babySchema),
    defaultValues: baby
      ? {
          name: baby.name,
          date_of_birth: baby.date_of_birth,
          premature_weeks: baby.premature_weeks,
          medical_conditions: baby.medical_conditions || '',
          temperament: baby.temperament || undefined,
          temperament_notes: baby.temperament_notes || '',
        }
      : {
          premature_weeks: 0,
        },
  })

  const temperament = watch('temperament')

  const temperamentOptions = [
    { value: 'easy', label: 'Easy-going' },
    { value: 'moderate', label: 'Moderate / average' },
    { value: 'adaptable', label: 'Adaptable / flexible' },
    { value: 'sensitive', label: 'Sensitive / easily overstimulated' },
    { value: 'slow_to_warm', label: 'Slow to warm up / cautious' },
    { value: 'persistent', label: 'Persistent / determined' },
    { value: 'spirited', label: 'Spirited / high needs' },
    { value: 'not_sure', label: 'Not sure yet' },
    { value: 'other', label: 'Other' },
  ] as const

  const onSubmit = async (data: BabyFormData) => {
    setLoading(true)

    try {
      if (mode === 'edit' && baby) {
        await updateBaby(baby.id, data)
        toast.success('Baby updated successfully!')
        router.push('/dashboard/babies')
      } else {
        const newBaby = await createBaby(data)
        toast.success('Baby added successfully!')
        // If returnTo is specified, redirect there with the new baby ID
        if (returnTo) {
          const url = new URL(returnTo, window.location.origin)
          url.searchParams.set('baby', newBaby.id)
          router.push(url.pathname + url.search)
        } else {
          router.push('/dashboard/babies')
        }
      }

      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === 'create'
            ? returnTo
              ? 'Step 1: Add Your Baby'
              : 'Add Baby'
            : 'Edit Baby'}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? returnTo
              ? "First, tell us a bit about your baby. Then we'll create your personalized sleep plan."
              : 'Add information about your baby to get started.'
            : 'Update your baby\'s information.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Baby&apos;s Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Enter baby&apos;s name"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              {...register('date_of_birth')}
            />
            {errors.date_of_birth && (
              <p className="text-sm text-red-500">
                {errors.date_of_birth.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="premature_weeks">
              Premature Weeks (if applicable)
            </Label>
            <Input
              id="premature_weeks"
              type="number"
              min="0"
              max="20"
              {...register('premature_weeks', { valueAsNumber: true })}
              placeholder="0"
            />
            <p className="text-sm text-gray-500">
              If your baby was born prematurely, enter how many weeks early
            </p>
            {errors.premature_weeks && (
              <p className="text-sm text-red-500">
                {errors.premature_weeks.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperament">Temperament</Label>
            <Select
              value={temperament}
              onValueChange={(value) =>
                setValue('temperament', value as BabyFormData['temperament'])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select temperament" />
              </SelectTrigger>
              <SelectContent>
                {temperamentOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.temperament && (
              <p className="text-sm text-red-500">
                {errors.temperament.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperament_notes">Temperament notes (optional)</Label>
            <Textarea
              id="temperament_notes"
              {...register('temperament_notes')}
              placeholder="Describe your baby's temperament in your own words or add extra details"
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Share anything that doesn&apos;t fit the list above.
            </p>
            {errors.temperament_notes && (
              <p className="text-sm text-red-500">
                {errors.temperament_notes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical_conditions">
              Medical Conditions (optional)
            </Label>
            <Textarea
              id="medical_conditions"
              {...register('medical_conditions')}
              placeholder="Any medical conditions or special considerations we should know about"
              rows={4}
            />
            {errors.medical_conditions && (
              <p className="text-sm text-red-500">
                {errors.medical_conditions.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 pt-2">
          <Button type="submit" disabled={loading}>
            {loading
              ? mode === 'create'
                ? returnTo
                  ? 'Continuing...'
                  : 'Adding...'
                : 'Saving...'
              : mode === 'create'
              ? returnTo
                ? 'Continue to Sleep Questionnaire'
                : 'Add Baby'
              : 'Save Changes'}
          </Button>
          {!returnTo && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
