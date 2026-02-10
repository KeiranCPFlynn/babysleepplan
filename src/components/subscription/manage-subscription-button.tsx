'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ManageSubscriptionButtonProps {
  hasStripeCustomer: boolean
}

export function ManageSubscriptionButton({ hasStripeCustomer }: ManageSubscriptionButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  const handleManage = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setCancelled(true)
      setConfirmCancel(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  if (cancelled) {
    return (
      <p className="text-sm text-gray-600">
        Your subscription has been cancelled. You&apos;ll keep access until the end of your current billing period.
      </p>
    )
  }

  if (confirmCancel) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-700">
          Are you sure? You&apos;ll keep access until the end of your current billing period.
        </p>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmCancel(false)}
            disabled={loading}
          >
            Never mind
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setConfirmCancel(true)}
      >
        Cancel Subscription
      </Button>
      {hasStripeCustomer && (
        <Button
          variant="outline"
          className="text-gray-600 border-gray-300 hover:bg-gray-50"
          onClick={handleManage}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            'Manage Billing'
          )}
        </Button>
      )}
    </div>
  )
}
