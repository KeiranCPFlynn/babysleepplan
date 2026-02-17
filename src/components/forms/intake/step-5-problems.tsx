'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'
import { sleepProblems, type IntakeFormData } from '@/lib/validations/intake'

export function Step5Problems() {
  const { register, setValue, control, formState: { errors } } = useFormContext<IntakeFormData>()

  // useWatch is more reliable for watching values in child components
  const selectedProblems = useWatch({
    control,
    name: 'problems',
    defaultValue: []
  })

  const toggleProblem = useCallback((problemValue: string) => {
    const currentProblems = Array.isArray(selectedProblems) ? selectedProblems : []
    const isCurrentlySelected = currentProblems.includes(problemValue)

    const updated = isCurrentlySelected
      ? currentProblems.filter((p: string) => p !== problemValue)
      : [...currentProblems, problemValue]

    setValue('problems', updated, { shouldDirty: true, shouldValidate: true })
  }, [selectedProblems, setValue])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sky-900">Sleep Challenges</h2>
        <p className="text-slate-600">
          What are the main sleep challenges you&apos;re facing? Select all that apply.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label>Select your sleep challenges <span className="text-red-500">*</span></Label>
          <div className="grid gap-3">
            {sleepProblems.map((problem) => {
              const problemsArray = Array.isArray(selectedProblems) ? selectedProblems : []
              const isSelected = problemsArray.includes(problem.value)
              return (
                <button
                  key={problem.value}
                  type="button"
                  onClick={() => toggleProblem(problem.value)}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors text-left w-full ${
                    isSelected ? 'bg-sky-50/70 border-sky-300' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className={`flex items-center justify-center w-5 h-5 rounded border mt-0.5 shrink-0 ${
                    isSelected
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">
                      {problem.label}
                    </span>
                    {problem.description && (
                      <span className="text-xs text-slate-500 block mt-1">
                        {problem.description}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {errors.problems && (
            <p className="text-sm text-red-500">{errors.problems.message}</p>
          )}
        </div>

        <div className="space-y-2 pt-4">
          <Label htmlFor="problem_description">Tell us more about your challenges (optional)</Label>
          <Textarea
            id="problem_description"
            {...register('problem_description')}
            placeholder="Describe your biggest sleep challenges in detail. What have you tried? What hasn&apos;t worked?"
            rows={5}
          />
          <p className="text-sm text-slate-500">
            The more details you provide, the more personalized your plan will be.
          </p>
          {errors.problem_description && (
            <p className="text-sm text-red-500">{errors.problem_description.message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
