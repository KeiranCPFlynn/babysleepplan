'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Baby, FileText, Plus, BookOpen, LogOut, Moon, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Babies', href: '/dashboard/babies', icon: Baby },
  { name: 'My Plans', href: '/dashboard/plans/current', icon: FileText },
  { name: 'Sleep Diary', href: '/dashboard/diary', icon: BookOpen },
  { name: 'New Plan', href: '/dashboard/intake/new', icon: Plus },
]

interface DashboardNavProps {
  open?: boolean
  onClose?: () => void
}

export function DashboardNav({ open = false, onClose }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isDiaryPath = pathname?.includes('/diary')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navContent = (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="h-6 w-6 text-sky-700" />
            <h1 className="text-2xl font-bold text-slate-900">LunaCradle</h1>
          </div>
          {/* Close button visible only in mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white/50"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : item.href === '/dashboard/diary'
            ? isDiaryPath
            : item.href === '/dashboard/plans/current'
            ? pathname?.startsWith('/dashboard/plans') && !isDiaryPath
            : pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/70 backdrop-blur text-sky-800 shadow-sm border border-white/60'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/40">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-white/50"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop: static sidebar (hidden on mobile) */}
      <div className="hidden md:flex flex-col h-full w-64 bg-white/30 backdrop-blur-xl text-slate-800 border-r border-white/50">
        {navContent}
      </div>

      {/* Mobile: overlay drawer */}
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 bg-black/40 z-40 transition-opacity',
            open ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
        />
        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white/95 backdrop-blur-xl text-slate-800 border-r border-white/50 transform transition-transform duration-200 ease-in-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {navContent}
        </div>
      </div>
    </>
  )
}
