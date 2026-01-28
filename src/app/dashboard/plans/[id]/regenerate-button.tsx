'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RegenerateButtonProps {
  planId: string
}

export function RegenerateButton({ planId }: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegenerate = async () => {
    if (!confirm('This will regenerate the plan with the current prompt. Continue?')) {
      return
    }

    setLoading(true)

    try {
      // First, reset the plan status to 'generating'
      const resetResponse = await fetch(`/api/plans/${planId}/reset`, {
        method: 'POST',
      })

      if (!resetResponse.ok) {
        throw new Error('Failed to reset plan')
      }

      // Then trigger regeneration
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to regenerate')
      }

      toast.success('Plan regenerated!')
      router.refresh()
    } catch (error) {
      console.error('Regenerate error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={loading}
      className="border-orange-300 text-orange-600 hover:bg-orange-50"
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Regenerating...' : 'Regenerate'}
    </Button>
  )
}
