import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AccessCodesManager } from './access-codes-manager'

export const dynamic = 'force-dynamic'

export default async function AdminAccessCodesPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/dashboard')
  }

  return (
    <div className="dashboard-surface max-w-4xl mx-auto space-y-6 p-5 sm:p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-sky-700 hover:text-sky-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-sky-900">Access Codes</h1>
        <p className="text-slate-600 mt-1">
          Create and manage invite-only access codes.
        </p>
      </div>

      <AccessCodesManager />
    </div>
  )
}
