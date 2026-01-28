'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { XCircle, Loader2 } from 'lucide-react'

interface CancelButtonProps {
  planId: string
}

export function CancelButton({ planId }: CancelButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/plans/${planId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel plan generation')
      }

      toast.success('Plan generation cancelled')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleCancel} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cancelling...
        </>
      ) : (
        <>
          <XCircle className="mr-2 h-4 w-4" />
          Cancel
        </>
      )}
    </Button>
  )
}
