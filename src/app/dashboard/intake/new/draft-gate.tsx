'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface DraftGateProps {
  draftId: string
  draftBabyName: string
  continueHref: string
}

export function DraftGate({ draftId, draftBabyName, continueHref }: DraftGateProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStartFresh() {
    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/intake/${draftId}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete draft. Please try again.')
        setDeleting(false)
        return
      }
      // Reload the page so the server component re-evaluates without the draft
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="bg-sky-700 hover:bg-sky-800">
          <Link href={continueHref}>
            Continue {draftBabyName}&apos;s Questionnaire
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleStartFresh}
          disabled={deleting}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {deleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            'Start Fresh'
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
