import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import { Moon } from 'lucide-react'
import Link from 'next/link'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute -top-32 -right-40 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-rose-300/60 via-pink-300/50 to-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute top-16 -left-40 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-sky-300/65 via-cyan-200/50 to-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-[20rem] w-[20rem] rounded-full bg-gradient-to-br from-amber-200/60 via-rose-200/50 to-sky-200/40 blur-3xl" />

      {/* Twinkling stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] left-[18%] h-1.5 w-1.5 rounded-full bg-sky-400/40 animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-[15%] right-[22%] h-1 w-1 rounded-full bg-amber-400/40 animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-[60%] left-[10%] h-1 w-1 rounded-full bg-rose-400/30 animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
        <div className="absolute top-[70%] right-[15%] h-1.5 w-1.5 rounded-full bg-violet-400/30 animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '2s' }} />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 group">
          <Moon className="h-8 w-8 text-sky-700 transition-transform group-hover:rotate-12" />
          <span className="text-xl font-semibold tracking-tight text-slate-900">Baby Sleep Plan</span>
        </Link>

        {children}
      </div>
    </div>
  )
}
