'use client'

import { useEffect, useState } from 'react'
import { hasActiveSubscription } from '@/lib/subscription'

interface SubscriptionStatus {
    status: string | null
    isActive: boolean
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
}

export function useSubscription(): SubscriptionStatus {
    const [status, setStatus] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

    const verifySubscription = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/verify-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to verify subscription')
            }

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            setStatus(data.status)

            if (data.fixed) {
                console.log('Subscription status was fixed:', data.status)
            }
        } catch (err) {
            console.error('Subscription verification error:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        verifySubscription()
    }, [])

    const isActive = hasActiveSubscription(status, isStripeEnabled)

    return {
        status,
        isActive,
        isLoading,
        error,
        refetch: verifySubscription,
    }
}