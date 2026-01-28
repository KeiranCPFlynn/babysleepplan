'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Loader2 } from 'lucide-react'

interface RetryButtonProps {
  planId: string
}

export function RetryButton({ planId }: RetryButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        throw new Error('Failed to retry plan generation')
      }

      toast.success('Plan generation restarted!')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRetry} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Retrying...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </>
      )}
    </Button>
  )
}
