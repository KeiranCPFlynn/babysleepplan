'use client'

import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function MaintenanceUnlockForm() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/maintenance/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nextPath: '/' }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Unable to unlock access.')
        return
      }

      window.location.href = data.redirectTo || '/'
    } catch {
      setError('Unable to unlock access right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <details className="mt-8 w-full rounded-xl border border-slate-200 bg-white p-4 text-left">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">
        Staff access
      </summary>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="maintenance-token" className="text-xs text-slate-600">
            Access token
          </Label>
          <Input
            id="maintenance-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter staff token"
            autoComplete="off"
            required
          />
        </div>
        <Button type="submit" disabled={loading || token.length === 0} className="bg-sky-700 hover:bg-sky-800">
          {loading ? 'Unlocking...' : 'Unlock This Browser'}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </details>
  )
}

