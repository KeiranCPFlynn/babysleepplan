import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { BabySelector } from './baby-selector'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function NewIntakePage({
  searchParams,
}: {
  searchParams: Promise<{ baby?: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const params = await searchParams
  const babyId = params.baby

  // Fetch babies using server-side client
  const { data: babies } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // If no babies, redirect to add baby
  if (!babies || babies.length === 0) {
    redirect('/dashboard/babies/new?returnTo=/dashboard/intake/new')
  }

  // Most users have one baby; skip the selector step.
  if (!babyId && babies.length === 1) {
    redirect(`/dashboard/intake/new?baby=${encodeURIComponent(babies[0].id)}`)
  }

  // If baby ID is provided, use client component to create intake via API
  if (babyId) {
    // Verify baby exists and belongs to user first
    const validBaby = babies.find(b => b.id === babyId)
    if (!validBaby) {
      redirect('/dashboard/intake/new')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create Sleep Plan</h1>
          <p className="text-gray-600 mt-2">
            Setting up your personalized questionnaire...
          </p>
        </div>
        <BabySelector babies={babies} selectedBabyId={babyId} />
      </div>
    )
  }

  // Otherwise, show baby selection page
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Sleep Plan</h1>
        <p className="text-gray-600 mt-2">
          Select which baby you&apos;d like to create a personalized sleep plan for.
        </p>
      </div>

      <BabySelector babies={babies} />

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">
            Don&apos;t see the right baby?{' '}
            <Link
              href="/dashboard/babies/new?returnTo=/dashboard/intake/new"
              className="text-blue-600 hover:underline"
            >
              Add a new baby
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
