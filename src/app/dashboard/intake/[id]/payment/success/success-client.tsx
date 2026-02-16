'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, Moon, Star, Sparkles, Heart } from 'lucide-react'

const generationStages = [
  {
    title: 'Reviewing your sleep questionnaire',
    detail: 'Checking routines, wake windows, and current challenges.',
    progress: 18,
  },
  {
    title: 'Matching age-appropriate sleep guidance',
    detail: "Selecting evidence-based recommendations for your baby's stage.",
    progress: 36,
  },
  {
    title: 'Building your personalized daily schedule',
    detail: 'Drafting bedtime, nap timing, and overnight support steps.',
    progress: 57,
  },
  {
    title: 'Tailoring settling and wake-up strategies',
    detail: 'Adjusting methods to your family preferences and comfort level.',
    progress: 78,
  },
  {
    title: 'Finalizing your plan and next steps',
    detail: 'Preparing your report layout and finishing touches.',
    progress: 94,
  },
]

interface SuccessClientProps {
  intakeId: string
  babyName: string
  isDevMode: boolean
  isAdditionalBaby: boolean
  initialPlan: { id: string; status: string } | null
}

export function SuccessClient({ intakeId, babyName, isDevMode, isAdditionalBaby, initialPlan }: SuccessClientProps) {
  const router = useRouter()
  const [plan, setPlan] = useState(initialPlan)
  const [dots, setDots] = useState(0)
  const [pollCount, setPollCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentStage, setCurrentStage] = useState(0)

  const triggerGeneration = useCallback(async (planId: string) => {
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('Client generation trigger failed:', response.status, payload)
      }
    } catch (err) {
      console.error('Client generation trigger request failed:', err)
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/intake-status?intakeId=${intakeId}`)
      if (!res.ok) {
        if (isDevMode) console.log('Poll request failed:', res.status)
        return null
      }
      const data = await res.json()
      if (data.plan) {
        setPlan(data.plan)
        if (isDevMode) console.log('Poll result:', data.plan.status)
      }
      return data
    } catch (err) {
      if (isDevMode) console.log('Poll error:', err)
      return null
    }
  }, [intakeId, isDevMode])

  // Reliability fallback: retry generation from the authenticated browser session
  // so we don't rely only on fire-and-forget server-side fetches.
  useEffect(() => {
    if (!plan?.id) return
    if (plan.status !== 'generating' && plan.status !== 'failed') return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0

    const triggerWithRetry = async () => {
      if (cancelled || attempts >= 6) return
      attempts += 1
      await triggerGeneration(plan.id)

      if (!cancelled && attempts < 6) {
        timer = setTimeout(() => {
          void triggerWithRetry()
        }, 15000)
      }
    }

    void triggerWithRetry()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [plan?.id, plan?.status, triggerGeneration])

  // Poll every 2 seconds with better status handling
  useEffect(() => {
    if (plan?.status === 'completed' || plan?.status === 'failed') return

    const interval = setInterval(async () => {
      const data = await poll()
      setPollCount(prev => prev + 1)

      if (!data) return // Network error, continue polling

      if (data.plan?.status === 'completed') {
        if (isDevMode) console.log('Plan completed! Redirecting...')
        // Immediate redirect for better UX
        router.push(`/dashboard/plans/${data.plan.id}`)
      } else if (data.plan?.status === 'failed') {
        setError('Failed to generate sleep plan. Please contact support.')
        if (isDevMode) console.log('Plan generation failed')
      } else if (pollCount > 90) { // Timeout after ~3 minutes
        setError('Plan generation is taking longer than expected. Please refresh the page.')
        if (isDevMode) console.log('Poll timeout reached')
      }
    }, 2000) // Faster polling for better responsiveness

    return () => clearInterval(interval)
  }, [plan?.status, poll, router, pollCount, isDevMode])

  // Animate dots
  useEffect(() => {
    if (plan?.status === 'completed') return
    const interval = setInterval(() => setDots(d => (d + 1) % 4), 500)
    return () => clearInterval(interval)
  }, [plan?.status])

  // Rotate stage messages so generation feels active and progressing
  useEffect(() => {
    if (plan?.status === 'completed' || plan?.status === 'failed') return

    const interval = setInterval(() => {
      setCurrentStage(prev => Math.min(prev + 1, generationStages.length - 1))
    }, 9000)

    return () => clearInterval(interval)
  }, [plan?.status])

  // Auto-redirect if plan was already complete on mount
  useEffect(() => {
    if (plan?.status === 'completed') {
      const timer = setTimeout(() => {
        router.push(`/dashboard/plans/${plan.id}`)
      }, 1000) // Faster redirect for better UX
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Error state - timeout or plan generation failed
  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200 bg-gradient-to-b from-red-50 to-white overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-red-800">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-red-700">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8 space-y-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Try Again
            </Button>
            <div>
              <Link href="/dashboard/intake" className="text-sm text-purple-600 hover:text-purple-700">
                ← Back to Intake Forms
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plan?.status === 'completed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-green-200 bg-gradient-to-b from-green-50 to-white overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              {babyName}&apos;s Sleep Plan is Ready!
            </CardTitle>
            <CardDescription className="text-green-700">
              Redirecting you to your personalized plan...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href={`/dashboard/plans/${plan.id}`}>
                View Your Sleep Plan
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plan?.status === 'failed') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-800">Something went wrong</CardTitle>
            <CardDescription className="text-red-600">
              We had trouble generating the plan. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/dashboard/plans">Go to My Plans</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeStage = generationStages[currentStage] ?? generationStages[0]

  // Generating state - beautiful animation
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isDevMode && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <p className="text-sky-800 text-sm font-medium">
            Dev Mode: Your plan is being generated without Stripe.
          </p>
          {pollCount > 0 && (
            <p className="text-sky-600 text-xs mt-1">
              Poll count: {pollCount} (status: {plan?.status || 'unknown'})
            </p>
          )}
        </div>
      )}

      <Card className="border-purple-200 bg-gradient-to-b from-purple-50 via-white to-sky-50 overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-purple-600" />
          </div>
          <CardTitle className="text-2xl text-purple-800">
            {isDevMode
              ? 'Plan Generation Started!'
              : isAdditionalBaby
                ? `${babyName}'s Plan Added!`
                : 'Trial Started Successfully!'}
          </CardTitle>
          <CardDescription className="text-purple-600">
            {isDevMode
              ? 'Your sleep plan is being created.'
              : isAdditionalBaby
                ? `${babyName}'s sleep plan has been added to your subscription.`
                : 'Your 5-day free trial has begun. Your personalized plan is being created.'}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-purple-100 overflow-hidden py-0 gap-0">
        <div className="relative bg-gradient-to-br from-purple-100 via-sky-50 to-pink-50 px-8 py-10 text-center">
          {/* Floating decorative icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Moon className="absolute top-6 left-[15%] h-6 w-6 text-purple-300/60 float-gentle" />
            <Star className="absolute top-10 right-[20%] h-5 w-5 text-pink-300/60 float-drift" />
            <Sparkles className="absolute bottom-8 left-[25%] h-5 w-5 text-sky-300/60 float-orbit" />
            <Heart className="absolute bottom-12 right-[15%] h-4 w-4 text-pink-300/50 float-gentle" />
            <Star className="absolute top-[40%] left-[8%] h-4 w-4 text-purple-200/50 float-drift" />
            <Moon className="absolute top-[35%] right-[10%] h-5 w-5 text-sky-200/50 float-orbit" />
          </div>

          {/* Animated moon spinner */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200/40" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-purple-300 animate-spin"
              style={{ animationDuration: '2s' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Moon className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-purple-800 mb-2">
            Creating {babyName}&apos;s Sleep Plan{'.'.repeat(dots)}
          </h2>
          <p className="text-purple-700 text-sm font-medium mb-1">
            Step {currentStage + 1} of {generationStages.length}: {activeStage.title}
          </p>
          <p className="text-purple-600 text-xs mb-1">
            {activeStage.detail}
          </p>
          <p className="text-purple-500 text-xs">
            This usually takes 1-2 minutes. We&apos;ll keep updating progress as we go.
          </p>

          {/* Animated progress bar */}
          <div className="mt-6 mx-auto max-w-xs h-2 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 rounded-full animate-pulse"
              style={{
                width: `${activeStage.progress}%`,
                animation: 'shimmerBar 2.5s ease-in-out infinite',
                transition: 'width 800ms ease-in-out',
              }}
            />
          </div>

          <div className="mt-5 mx-auto max-w-md space-y-2 text-left">
            {generationStages.map((stage, index) => {
              const isComplete = index < currentStage
              const isActive = index === currentStage

              return (
                <div key={stage.title} className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isComplete
                        ? 'bg-emerald-500'
                        : isActive
                          ? 'bg-purple-500 animate-pulse'
                          : 'bg-purple-200'
                    }`}
                  />
                  <p
                    className={`text-xs ${
                      isComplete || isActive ? 'text-purple-700' : 'text-purple-400'
                    }`}
                  >
                    {stage.title}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <CardContent className="py-6 text-center space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-5 py-4 max-w-md mx-auto">
            <p className="text-purple-800 text-sm font-medium mb-1">
              You can leave this page
            </p>
            <p className="text-purple-600 text-xs">
              Your plan is being created in the background. Come back in a minute or two,
              or we&apos;ll redirect you automatically when it&apos;s ready.
            </p>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" asChild className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <Link href="/dashboard/plans">
                Go to My Plans
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
