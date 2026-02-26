'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Copy, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { AccessCode, AccessCodeCategory } from '@/types/database.types'
import { formatUniversalDate } from '@/lib/date-format'

const CATEGORIES: AccessCodeCategory[] = ['founding', 'partner', 'student', 'custom']

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

interface Redemption {
  id: string
  user_id: string
  email: string
  trial_ends_at: string
  created_at: string
}

export function AccessCodesManager() {
  const [codes, setCodes] = useState<AccessCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCode, setEditingCode] = useState<AccessCode | null>(null)
  const [expandedRedemptions, setExpandedRedemptions] = useState<string | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [redemptionsLoading, setRedemptionsLoading] = useState(false)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formTrialDays, setFormTrialDays] = useState('14')
  const [formMaxRedemptions, setFormMaxRedemptions] = useState('')
  const [formCategory, setFormCategory] = useState<AccessCodeCategory>('custom')
  const [formNote, setFormNote] = useState('')
  const [formStartsAt, setFormStartsAt] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadCodes = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/access-codes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCodes(data.codes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadCodes() }, [loadCodes])

  function resetForm() {
    setFormCode(generateCode())
    setFormTrialDays('14')
    setFormMaxRedemptions('')
    setFormCategory('custom')
    setFormNote('')
    setFormStartsAt('')
    setFormExpiresAt('')
    setFormEnabled(true)
    setFormError(null)
    setEditingCode(null)
  }

  function openCreateForm() {
    resetForm()
    setShowForm(true)
  }

  function openEditForm(code: AccessCode) {
    setEditingCode(code)
    setFormCode(code.code)
    setFormTrialDays(String(code.trial_days))
    setFormMaxRedemptions(code.max_redemptions !== null ? String(code.max_redemptions) : '')
    setFormCategory(code.category)
    setFormNote(code.note || '')
    setFormStartsAt(code.starts_at ? code.starts_at.slice(0, 16) : '')
    setFormExpiresAt(code.expires_at ? code.expires_at.slice(0, 16) : '')
    setFormEnabled(code.enabled)
    setFormError(null)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formCode.trim()) {
      setFormError('Code is required')
      return
    }
    setIsSaving(true)
    setFormError(null)

    const payload: Record<string, unknown> = {
      code: formCode.trim(),
      trial_days: parseInt(formTrialDays) || 14,
      max_redemptions: formMaxRedemptions ? parseInt(formMaxRedemptions) : null,
      category: formCategory,
      note: formNote.trim() || null,
      starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
      expires_at: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      enabled: formEnabled,
    }

    if (editingCode) {
      payload.id = editingCode.id
    }

    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowForm(false)
      resetForm()
      await loadCodes()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleEnabled(code: AccessCode) {
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, enabled: !code.enabled }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      await loadCodes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle')
    }
  }

  async function loadRedemptions(codeId: string) {
    if (expandedRedemptions === codeId) {
      setExpandedRedemptions(null)
      return
    }
    setRedemptionsLoading(true)
    setExpandedRedemptions(codeId)
    try {
      const res = await fetch(`/api/admin/access-codes/redemptions?codeId=${codeId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRedemptions(data.redemptions || [])
    } catch {
      setRedemptions([])
    } finally {
      setRedemptionsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={loadCodes} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{codes.length} code{codes.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadCodes}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={openCreateForm} className="bg-sky-700 hover:bg-sky-800">
            <Plus className="h-3.5 w-3.5 mr-1" /> New Code
          </Button>
        </div>
      </div>

      {/* Create/Edit form */}
      {showForm && (
        <Card className="border-sky-200 bg-sky-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-sky-900">
              {editingCode ? 'Edit Access Code' : 'Create Access Code'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Code</label>
                <div className="flex gap-1.5">
                  <Input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="uppercase font-mono text-sm"
                    placeholder="CODE"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormCode(generateCode())}
                    title="Generate random code"
                    className="shrink-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Trial Days</label>
                <Input
                  type="number"
                  value={formTrialDays}
                  onChange={(e) => setFormTrialDays(e.target.value)}
                  min={1}
                  max={365}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Max Redemptions (blank = unlimited)</label>
                <Input
                  type="number"
                  value={formMaxRedemptions}
                  onChange={(e) => setFormMaxRedemptions(e.target.value)}
                  min={1}
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as AccessCodeCategory)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Starts At (optional)</label>
                <Input
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Expires At (optional)</label>
                <Input
                  type="datetime-local"
                  value={formExpiresAt}
                  onChange={(e) => setFormExpiresAt(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Internal Note (optional)</label>
              <Input
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="e.g. For founding families batch 1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="form-enabled"
                checked={formEnabled}
                onChange={(e) => setFormEnabled(e.target.checked)}
                className="rounded border-slate-300"
              />
              <label htmlFor="form-enabled" className="text-sm text-slate-700">Enabled</label>
            </div>

            {formError && <p className="text-xs text-red-600">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-sky-700 hover:bg-sky-800"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                {editingCode ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowForm(false); resetForm() }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Code list */}
      {codes.length === 0 && !showForm && (
        <p className="text-center text-sm text-slate-500 py-8">No access codes yet.</p>
      )}

      {codes.map((code) => (
        <Card key={code.id} className={`dashboard-card-soft ${!code.enabled ? 'opacity-60' : ''}`}>
          <CardContent className="pt-4 pb-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-sky-900">{code.code}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(code.code)}
                  className="text-slate-400 hover:text-slate-600"
                  title="Copy code"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
                  code.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {code.enabled ? 'Active' : 'Disabled'}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-sky-100 text-sky-700">
                  {code.category}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleEnabled(code)}
                >
                  {code.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => openEditForm(code)}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              <span>{code.trial_days} day{code.trial_days !== 1 ? 's' : ''}</span>
              <span>
                {code.redeemed_count} / {code.max_redemptions ?? '\u221E'} redeemed
              </span>
              {code.starts_at && <span>From: {formatUniversalDate(code.starts_at)}</span>}
              {code.expires_at && <span>Until: {formatUniversalDate(code.expires_at)}</span>}
              {code.note && <span className="italic">{code.note}</span>}
            </div>

            {/* Redemption details toggle */}
            {code.redeemed_count > 0 && (
              <div>
                <button
                  onClick={() => loadRedemptions(code.id)}
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
                >
                  {expandedRedemptions === code.id ? (
                    <><ChevronUp className="h-3 w-3" /> Hide redemptions</>
                  ) : (
                    <><ChevronDown className="h-3 w-3" /> View redemptions ({code.redeemed_count})</>
                  )}
                </button>

                {expandedRedemptions === code.id && (
                  <div className="mt-2 border border-slate-100 rounded-md overflow-hidden">
                    {redemptionsLoading ? (
                      <div className="p-3 text-center">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400 mx-auto" />
                      </div>
                    ) : redemptions.length === 0 ? (
                      <p className="p-3 text-xs text-slate-400">No redemptions found.</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left px-3 py-1.5 font-medium text-slate-600">Email</th>
                            <th className="text-left px-3 py-1.5 font-medium text-slate-600">Redeemed</th>
                            <th className="text-left px-3 py-1.5 font-medium text-slate-600">Trial Ends</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map((r) => (
                            <tr key={r.id} className="border-t border-slate-100">
                              <td className="px-3 py-1.5 text-slate-700">{r.email}</td>
                              <td className="px-3 py-1.5 text-slate-500">{formatUniversalDate(r.created_at)}</td>
                              <td className="px-3 py-1.5 text-slate-500">{formatUniversalDate(r.trial_ends_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
