'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

interface EmailGateProps {
  sessionId: string
  onSuccess: () => void
}

export function EmailGate({ sessionId, onSuccess }: EmailGateProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [succeeded, setSucceeded] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)

    try {
      // GA4 event: email submitted
      window.gtag?.('event', 'free_schedule_email_submitted', { free_schedule: true })

      const res = await fetch('/api/free-schedule/send-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, email: data.email }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        if (json.error === 'rate_limited') {
          toast.error(json.message || 'Rate limit reached. Please try again later.')
        } else {
          toast.error('Something went wrong. Please try again.')
        }
        return
      }

      // GA4 event: PDF sent confirmed
      window.gtag?.('event', 'free_schedule_pdf_sent', { free_schedule: true })

      setSucceeded(true)
      onSuccess()
    } catch {
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (succeeded) {
    return (
      <div className="text-center py-6 px-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl">
        <div className="text-3xl mb-3">✓</div>
        <h3 className="text-base font-semibold text-green-800 dark:text-green-300 mb-1">
          Check your inbox!
        </h3>
        <p className="text-sm text-green-700 dark:text-green-400">
          Your sleep schedule PDF is on its way. It usually arrives within a minute.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-100 dark:border-sky-900 rounded-xl p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          See the full adjustments + get your PDF
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your email to unlock the if/then guide and receive the printable PDF. We&apos;ll also send occasional sleep tips from LunaCradle — unsubscribe anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isLoading}
            className="border-slate-200 dark:border-slate-700 dark:bg-slate-900"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-sky-700 hover:bg-sky-800 text-white w-full"
        >
          {isLoading ? 'Sending…' : 'Email me the PDF'}
        </Button>
      </form>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        No account needed. Unsubscribe anytime.
      </p>
    </div>
  )
}
