import Link from 'next/link'
import { Wrench } from 'lucide-react'
import { MaintenanceUnlockForm } from './unlock-form'

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-sky-50 px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <div className="mb-5 rounded-full bg-sky-100 p-4">
          <Wrench className="h-8 w-8 text-sky-700" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Under Construction</h1>
        <p className="mt-3 text-slate-600">
          LunaCradle is temporarily in maintenance mode while we complete updates.
          Please check back shortly.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          If you need help urgently, contact support.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </Link>
        <MaintenanceUnlockForm />
      </div>
    </main>
  )
}
