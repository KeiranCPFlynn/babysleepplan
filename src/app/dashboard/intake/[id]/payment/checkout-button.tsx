'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CreditCard, Loader2, Sparkles } from 'lucide-react'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

interface CheckoutButtonProps {
  intakeId: string
  babyName: string
}

export function CheckoutButton({ intakeId, babyName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intakeId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout (or success page in dev mode)
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
      className="w-full"
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isStripeEnabled ? 'Redirecting to checkout...' : 'Generating plan...'}
        </>
      ) : isStripeEnabled ? (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay $29 for {babyName}'s Plan
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate {babyName}'s Plan (Dev Mode)
        </>
      )}
    </Button>
  )
}
