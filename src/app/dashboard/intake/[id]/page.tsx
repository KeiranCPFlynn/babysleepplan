import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { IntakeForm } from '@/components/forms/intake'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { id } = await params

  try {
    // Fetch intake, babies, and profile
    const [intakeResult, babiesResult, profileResult] = await Promise.all([
      supabase
        .from('intake_submissions')
        .select('*')
        .eq('id', id)
        .single(),
      supabase
        .from('babies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('has_used_trial, subscription_status')
        .eq('id', user.id)
        .single(),
    ])

    if (intakeResult.error) throw intakeResult.error

    const intake = intakeResult.data
    const babies = babiesResult.data || []

    if (intake.status === 'paid') {
      redirect(`/dashboard/plans?intake=${id}`)
    }

    // If intake was submitted, reset to draft so user can edit
    // (they clicked "back to questionnaire" from payment page)
    if (intake.status === 'submitted') {
      await supabase
        .from('intake_submissions')
        .update({ status: 'draft' })
        .eq('id', id)
        .eq('user_id', user.id)
      intake.status = 'draft'
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sleep Plan Questionnaire</h1>
          <p className="text-gray-600 mt-2">
            Tell us about your baby&apos;s sleep so we can create a personalized plan.
          </p>
        </div>

        <IntakeForm babies={babies} intake={intake} hasUsedTrial={profileResult.data?.has_used_trial === true} />
      </div>
    )
  } catch {
    notFound()
  }
}
