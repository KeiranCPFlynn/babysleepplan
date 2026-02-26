'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CreditCard, Loader2, Sparkles } from 'lucide-react'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

interface ReactivateCheckoutButtonProps {
  planId: string
  babyName: string
}

export function ReactivateCheckoutButton({ planId, babyName }: ReactivateCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/reactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to start checkout'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      className="w-full bg-sky-700 text-white shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-800"
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isStripeEnabled ? 'Redirecting to checkout...' : 'Reactivating...'}
        </>
      ) : isStripeEnabled ? (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Subscribe Now
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Reactivate {babyName}&apos;s Plan (Dev Mode)
        </>
      )}
    </Button>
  )
}
