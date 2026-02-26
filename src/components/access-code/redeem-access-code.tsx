'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Ticket, CheckCircle, Loader2 } from 'lucide-react'
import { formatUniversalDate } from '@/lib/date-format'

interface RedeemAccessCodeProps {
  /** When provided, redemption also activates the intake and triggers plan generation */
  intakeId?: string
  babyId?: string
  /** Start with the form expanded */
  defaultOpen?: boolean
}

export function RedeemAccessCode({ intakeId, babyId, defaultOpen = false }: RedeemAccessCodeProps) {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ trial_ends_at: string; trial_days: number; intakeId?: string } | null>(null)

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim() || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/access-code/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          ...(intakeId && babyId ? { intakeId, babyId } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to redeem code.')
        return
      }

      setResult({
        trial_ends_at: data.trial_ends_at,
        trial_days: data.trial_days,
        intakeId: data.intakeId,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (result) {
    // If we activated an intake, redirect to the success page
    const handleContinue = () => {
      if (result.intakeId) {
        router.push(`/dashboard/intake/${result.intakeId}/payment/success?dev_mode=true`)
      } else {
        window.location.reload()
      }
    }

    return (
      <Card className="border-green-200 bg-green-50/60 dark:border-green-700/60 dark:bg-green-950/35">
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            Access code redeemed! You have full access until{' '}
            <span className="font-semibold">{formatUniversalDate(result.trial_ends_at)}</span>.
          </p>
          <Button
            onClick={handleContinue}
            className="bg-green-700 hover:bg-green-800"
          >
            {result.intakeId ? 'Generate My Plan' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-700 transition-colors"
      >
        <Ticket className="h-3.5 w-3.5" />
        Have an access code?
      </button>
    )
  }

  return (
    <Card className="dashboard-card-soft border-sky-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-sky-900 flex items-center gap-2">
          <Ticket className="h-4 w-4" />
          Redeem Access Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRedeem} className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setError(null)
            }}
            placeholder="Enter code"
            className="uppercase font-mono text-sm"
            maxLength={50}
            autoFocus
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!code.trim() || isLoading}
            size="sm"
            className="bg-sky-700 hover:bg-sky-800 shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
          </Button>
        </form>
        {error && (
          <p className="text-xs text-red-600 mt-2">{error}</p>
        )}
        {!defaultOpen && (
          <button
            onClick={() => { setIsOpen(false); setCode(''); setError(null) }}
            className="text-xs text-slate-400 hover:text-slate-600 mt-2"
          >
            Cancel
          </button>
        )}
      </CardContent>
    </Card>
  )
}
