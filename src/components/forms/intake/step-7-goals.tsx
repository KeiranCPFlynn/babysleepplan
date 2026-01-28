'use client'

import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { IntakeFormData } from '@/lib/validations/intake'

export function Step7Goals() {
  const { register, formState: { errors } } = useFormContext<IntakeFormData>()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Goals</h2>
        <p className="text-gray-600">
          What does sleep success look like for your family?
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="success_description">What does success look like?</Label>
          <Textarea
            id="success_description"
            {...register('success_description')}
            placeholder="e.g., Baby sleeps through the night without needing to be fed, baby falls asleep independently at bedtime, we have a consistent schedule..."
            rows={4}
          />
          <p className="text-sm text-gray-500">
            Describe what you hope to achieve with this sleep plan. Be specific!
          </p>
          {errors.success_description && (
            <p className="text-sm text-red-500">{errors.success_description.message}</p>
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
          <p className="text-sm text-gray-500">
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
