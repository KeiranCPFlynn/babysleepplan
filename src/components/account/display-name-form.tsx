'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DisplayNameFormProps {
  initialName: string | null
}

export function DisplayNameForm({ initialName }: DisplayNameFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName ?? '')
  const [loading, setLoading] = useState(false)

  const normalizedInitial = (initialName ?? '').trim()
  const normalizedCurrent = name.trim()
  const isUnchanged = useMemo(() => normalizedCurrent === normalizedInitial, [normalizedCurrent, normalizedInitial])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!normalizedCurrent) {
      toast.error('Display name cannot be empty')
      return
    }

    if (normalizedCurrent.length > 100) {
      toast.error('Display name must be 100 characters or fewer')
      return
    }

    if (isUnchanged) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName: normalizedCurrent }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update display name')
      }

      toast.success('Display name updated')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update display name')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-2" onSubmit={onSubmit}>
      <Label htmlFor="display-name" className="text-slate-700 dark:text-slate-200">
        Display name
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          placeholder="Your name"
          className="bg-white/85 border-sky-100 dark:bg-slate-800/90 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <Button
          type="submit"
          className="bg-sky-700 hover:bg-sky-800"
          disabled={loading || isUnchanged}
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">This is shown in your dashboard welcome message.</p>
    </form>
  )
}
