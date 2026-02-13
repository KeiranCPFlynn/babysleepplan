'use client'

import { useState } from 'react'
import { Menu, Moon } from 'lucide-react'
import { DashboardNav } from './dashboard-nav'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DashboardNav open={open} onClose={() => setOpen(false)} />

      <div className="relative flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Mobile header bar */}
        <div className="md:hidden flex shrink-0 items-center gap-3 px-4 py-3 bg-white/30 backdrop-blur-xl border-b border-white/50 z-10 print:hidden">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/50"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-sky-700" />
            <span className="text-lg font-bold text-slate-900">LunaCradle</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
