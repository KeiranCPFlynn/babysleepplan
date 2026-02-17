'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { DashboardNav } from './dashboard-nav'
import { BrandLogo } from '@/components/brand/brand-logo'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DashboardNav open={open} onClose={() => setOpen(false)} />

      <div className="relative flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Mobile header bar */}
        <div className="md:hidden flex shrink-0 items-center gap-3 px-4 py-3 bg-white/55 backdrop-blur-xl border-b border-white/70 z-10 print:hidden dark:bg-slate-950/90 dark:border-slate-800">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/60 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo size={20} className="h-5 w-5" />
            <span className="text-lg font-bold text-sky-800 dark:text-sky-200">LunaCradle</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
