'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { intakeSchema, step1Schema, type IntakeFormData } from '@/lib/validations/intake'
import { updateIntakeSubmission, submitIntake } from '@/lib/api/intake'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Baby, IntakeSubmission } from '@/types/database.types'
import { Step1Baby } from './step-1-baby'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
import { Step2CurrentSleep } from './step-2-current-sleep'
import { Step3NightWakings } from './step-3-night-wakings'
import { Step4Naps } from './step-4-naps'
import { Step5Problems } from './step-5-problems'
import { Step6Preferences } from './step-6-preferences'
import { Step7Goals } from './step-7-goals'
import { Step8Review } from './step-8-review'

interface IntakeFormProps {
  babies: Baby[]
  intake: IntakeSubmission
}

const TOTAL_STEPS = 8

const stepTitles = [
  'Baby',
  'Bedtime',
  'Night',
  'Naps',
  'Challenges',
  'Preferences',
  'Goals',
  'Review',
]

export function IntakeForm({ babies, intake }: IntakeFormProps) {
  const router = useRouter()
  // Start at step 2 if baby is already selected (from intake creation page)
  const [currentStep, setCurrentStep] = useState(intake.baby_id ? 2 : 1)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Track intake status - if not draft, don't allow saves
  // Treat null/undefined as 'draft' for backwards compatibility
  const [intakeStatus, setIntakeStatus] = useState(intake.status || 'draft')

  // Ref to track if form is still active (not submitted/unmounted)
  const isActiveRef = useRef(true)

  // Ref to store pending save timer so we can cancel it
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)

  const intakeData = (intake.data && typeof intake.data === 'object')
    ? intake.data as Record<string, unknown>
    : {}
  const storedAdditionalSleepTimes = Array.isArray(intakeData.additional_sleep_times)
    ? intakeData.additional_sleep_times as Array<{ bedtime?: string; waketime?: string }>
    : []

  const methods = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      baby_id: intake.baby_id || '',
      current_bedtime: intake.current_bedtime || '',
      current_waketime: intake.current_waketime || '',
      falling_asleep_method: intake.falling_asleep_method || '',
      additional_sleep_times: storedAdditionalSleepTimes,
      night_wakings_count: intake.night_wakings_count ?? undefined,
      night_wakings_description: intake.night_wakings_description || '',
      night_waking_duration: intake.night_waking_duration || '',
      night_waking_pattern: intake.night_waking_pattern || '',
      nap_count: intake.nap_count ?? undefined,
      nap_duration: intake.nap_duration || '',
      nap_method: intake.nap_method || '',
      nap_location: intake.nap_location || '',
      problems: intake.problems || [],
      problem_description: intake.problem_description || '',
      crying_comfort_level: intake.crying_comfort_level ?? 3,
      parent_constraints: intake.parent_constraints || '',
      success_description: intake.success_description || '',
      additional_notes: intake.additional_notes || '',
    },
  })

  const { formState: { isDirty }, watch, trigger } = methods

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const buildSubmissionData = useCallback(() => {
    const values = methods.getValues()
    const { additional_sleep_times, ...rest } = values
    const normalizedAdditionalTimes = Array.isArray(additional_sleep_times)
      ? additional_sleep_times.filter((time) => time?.bedtime || time?.waketime)
      : []

    return {
      ...rest,
      // Convert empty strings to null for database
      current_bedtime: rest.current_bedtime || null,
      current_waketime: rest.current_waketime || null,
      falling_asleep_method: rest.falling_asleep_method || null,
      night_waking_duration: rest.night_waking_duration || null,
      night_wakings_description: rest.night_wakings_description || null,
      night_waking_pattern: rest.night_waking_pattern || null,
      nap_duration: rest.nap_duration || null,
      nap_method: rest.nap_method || null,
      nap_location: rest.nap_location || null,
      problem_description: rest.problem_description || null,
      parent_constraints: rest.parent_constraints || null,
      success_description: rest.success_description || null,
      additional_notes: rest.additional_notes || null,
      data: {
        ...intakeData,
        additional_sleep_times: normalizedAdditionalTimes,
      },
    }
  }, [methods, intakeData])

  // Save immediately when user leaves page or switches tabs
  useEffect(() => {
    const saveBeforeLeave = () => {
      if (!isActiveRef.current || intakeStatus !== 'draft') return

      // Cancel pending debounced save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }

      // Synchronous save using sendBeacon for reliability on page close
      const data = buildSubmissionData()

      // Use sendBeacon for page unload - it's more reliable than fetch
      navigator.sendBeacon(
        `/api/intake/${intake.id}`,
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      )
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveBeforeLeave()
      }
    }

    // beforeunload fires when closing tab/window
    window.addEventListener('beforeunload', saveBeforeLeave)
    // visibilitychange fires when switching tabs (more reliable on mobile)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', saveBeforeLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [buildSubmissionData, intake.id, intakeStatus, methods])

  // Prepare form data for save
  const prepareFormData = useCallback(() => {
    return buildSubmissionData()
  }, [buildSubmissionData])

  // Save form data
  const saveForm = useCallback(async () => {
    // Multiple guards to prevent saving when we shouldn't
    if (!isActiveRef.current) return
    if (!isDirty) return
    if (intakeStatus !== 'draft') return

    setSaving(true)
    try {
      const data = prepareFormData()
      await updateIntakeSubmission(intake.id, data)

      // Only update state if still active
      if (isActiveRef.current) {
        setLastSaved(new Date())
        // Reset dirty state using CURRENT form values (not saved data)
        // This preserves any changes made during the save operation
        methods.reset(methods.getValues())
      }
    } catch (error) {
      // Only log if still active - ignore errors after submission
      if (isActiveRef.current && intakeStatus === 'draft') {
        console.error('Auto-save error:', error)
      }
    } finally {
      if (isActiveRef.current) {
        setSaving(false)
      }
    }
  }, [isDirty, intake.id, intakeStatus, methods, prepareFormData])

  // Schedule a debounced save
  const scheduleSave = useCallback(() => {
    // Cancel any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Don't schedule if not active or not draft
    if (!isActiveRef.current || intakeStatus !== 'draft') return

    saveTimerRef.current = setTimeout(() => {
      saveForm()
    }, 2000)
  }, [saveForm, intakeStatus])

  // Watch for form changes and schedule saves
  useEffect(() => {
    const subscription = watch(() => {
      scheduleSave()
    })
    return () => subscription.unsubscribe()
  }, [watch, scheduleSave])

  // Save on step change (but not on initial mount)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Cancel pending debounced save and save immediately
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveForm()
  }, [currentStep]) // Intentionally not including saveForm to avoid loops

  const validateCurrentStep = async () => {
    switch (currentStep) {
      case 1:
        return await trigger('baby_id')
      default:
        return true // Other steps have optional fields
    }
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (!isValid) return

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = async (step: number) => {
    // Only allow going back or to completed steps
    if (step < currentStep) {
      setCurrentStep(step)
    } else if (step === currentStep + 1) {
      // Allow going to next step if current is valid
      const isValid = await validateCurrentStep()
      if (isValid) {
        setCurrentStep(step)
      }
    }
  }

  const handleSubmit = async () => {
    // Validate step 1 (baby selection is required)
    const values = methods.getValues()
    const result = step1Schema.safeParse({ baby_id: values.baby_id })
    if (!result.success) {
      toast.error('Please select a baby before submitting')
      setCurrentStep(1)
      return
    }

    // Cancel any pending saves
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    // Mark as inactive to prevent any further saves
    isActiveRef.current = false
    setSubmitting(true)

    try {
      // Final save before submission
      if (methods.formState.isDirty) {
        const data = prepareFormData()
        await updateIntakeSubmission(intake.id, data)
      }

      // Submit the intake (changes status to 'submitted')
      await submitIntake(intake.id)
      setIntakeStatus('submitted')

      if (isStripeEnabled) {
        // Paid mode: go to payment page
        toast.success('Intake submitted successfully!')
        router.push(`/dashboard/intake/${intake.id}/payment`)
      } else {
        // Free mode: directly trigger plan generation
        toast.success('Generating your sleep plan...')
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ intakeId: intake.id }),
        })
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to start plan generation')
        }
        if (data.url) {
          router.push(data.url)
        } else {
          throw new Error('No redirect URL received')
        }
      }
    } catch (error) {
      // Reset active flag on error so user can try again
      isActiveRef.current = true
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Baby babies={babies} />
      case 2:
        return <Step2CurrentSleep />
      case 3:
        return <Step3NightWakings />
      case 4:
        return <Step4Naps />
      case 5:
        return <Step5Problems />
      case 6:
        return <Step6Preferences />
      case 7:
        return <Step7Goals />
      case 8:
        return <Step8Review babies={babies} />
      default:
        return null
    }
  }

  // If intake is not a draft, show a message
  if (intakeStatus !== 'draft') {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600">
            This intake has already been submitted.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/dashboard/intake/${intake.id}/payment`)}
          >
            {isStripeEnabled ? 'Continue to Payment' : 'Generate Plan'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            {saving && (
              <span className="text-sm text-gray-400">Saving...</span>
            )}
            {!saving && lastSaved && (
              <span className="text-sm text-gray-400">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {stepTitles.map((title, index) => {
              const stepNum = index + 1
              const isActive = stepNum === currentStep
              const isCompleted = stepNum < currentStep
              return (
                <button
                  key={title}
                  onClick={() => handleStepClick(stepNum)}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-blue-600'
                      : isCompleted
                      ? 'bg-blue-400 cursor-pointer hover:bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                  title={title}
                  type="button"
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            {stepTitles.map((title, index) => (
              <span
                key={title}
                className={`text-xs ${
                  index + 1 === currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {title}
              </span>
            ))}
          </div>
        </div>

        {/* Form content */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
          <CardFooter className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : isStripeEnabled ? 'Submit & Continue to Payment' : 'Submit & Generate Plan'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </FormProvider>
  )
}
