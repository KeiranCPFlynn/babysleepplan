'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteBabyButtonProps {
  babyId: string
  babyName: string
}

export function DeleteBabyButton({ babyId, babyName }: DeleteBabyButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/babies/${babyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete')
      }

      toast.success(`${babyName} has been removed`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const handleCancel = () => {
    setConfirming(false)
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Delete'
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={deleting}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-gray-500 hover:text-red-600"
      title={`Delete ${babyName}`}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
