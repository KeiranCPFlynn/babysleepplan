import { requireAuth } from '@/lib/auth'
import { DashboardShell } from '@/components/layout/dashboard-shell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <div className="relative flex h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Ambient blobs (smaller/more transparent than landing page) */}
      <div className="pointer-events-none absolute -top-32 -right-40 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-rose-300/50 via-pink-300/40 to-amber-200/40 float-reverse blob-morph" />
      <div className="pointer-events-none absolute top-12 -left-44 h-[20rem] w-[20rem] rounded-full bg-gradient-to-br from-sky-300/50 via-cyan-200/40 to-indigo-200/35 float blob-morph-alt" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-amber-200/50 via-rose-200/40 to-sky-200/35 float-slow blob-morph" />

      {/* Twinkling stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[10%] left-[20%] h-1 w-1 rounded-full bg-sky-400/30 twinkle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[15%] right-[25%] h-1 w-1 rounded-full bg-amber-400/30 twinkle-slow" style={{ animationDelay: '0.7s' }} />
        <div className="absolute top-[30%] left-[12%] h-1 w-1 rounded-full bg-rose-400/25 twinkle-fast" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[20%] right-[40%] h-1.5 w-1.5 rounded-full bg-violet-400/25 twinkle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[45%] left-[50%] h-1 w-1 rounded-full bg-sky-300/30 twinkle-slow" style={{ animationDelay: '0.3s' }} />
      </div>

      <DashboardShell>{children}</DashboardShell>
    </div>
  )
}
