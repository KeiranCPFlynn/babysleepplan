'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Baby, FileText, Plus, BookOpen, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Babies', href: '/dashboard/babies', icon: Baby },
  { name: 'My Plans', href: '/dashboard/plans', icon: FileText },
  { name: 'Sleep Diary', href: '/dashboard/diary', icon: BookOpen },
  { name: 'New Plan', href: '/dashboard/intake/new', icon: Plus },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const isDiaryPath = pathname?.includes('/diary')

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full w-64 bg-[#F7F2FB] text-purple-900 border-r border-purple-100">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-purple-800">Baby Sleep Plan</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : item.href === '/dashboard/diary'
            ? isDiaryPath
            : item.href === '/dashboard/plans'
            ? (pathname === item.href || pathname?.startsWith(item.href + '/')) && !isDiaryPath
            : pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white text-purple-900 shadow-sm ring-1 ring-purple-100'
                  : 'text-purple-700 hover:bg-white/80 hover:text-purple-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-purple-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-purple-700 hover:text-purple-900 hover:bg-white/80"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
