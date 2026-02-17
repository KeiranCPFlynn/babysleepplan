import Link from 'next/link'
import { UpdatePasswordForm } from '@/components/forms/update-password-form'
import { BrandLogo } from '@/components/brand/brand-logo'

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-32 -right-40 h-[24rem] w-[24rem] rounded-full bg-gradient-to-br from-rose-300/60 via-pink-300/50 to-amber-200/50 blur-3xl dark:from-rose-500/20 dark:via-fuchsia-500/15 dark:to-amber-500/10" />
      <div className="pointer-events-none absolute top-16 -left-40 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-sky-300/65 via-cyan-200/50 to-indigo-200/40 blur-3xl dark:from-sky-500/20 dark:via-cyan-500/15 dark:to-indigo-500/10" />

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8 group">
          <BrandLogo size={32} className="h-8 w-8 transition-transform group-hover:rotate-12" />
          <span className="text-xl font-semibold tracking-tight text-sky-800 dark:text-sky-300">LunaCradle</span>
        </Link>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}
