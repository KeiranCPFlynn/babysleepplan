'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield } from 'lucide-react'

export function AdminPanel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-orange-700">
          <Shield className="h-3.5 w-3.5" />
          Admin Tools
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-orange-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-orange-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-orange-200 px-4 py-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}
