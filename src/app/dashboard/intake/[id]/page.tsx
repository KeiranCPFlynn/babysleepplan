import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { IntakeForm } from '@/components/forms/intake'

// Disable caching for this page to ensure fresh data
export const dynamic = 'force-dynamic'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { id } = await params

  try {
    // Fetch intake and babies using server-side client
    const [intakeResult, babiesResult] = await Promise.all([
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
    ])

    if (intakeResult.error) throw intakeResult.error

    const intake = intakeResult.data
    const babies = babiesResult.data || []

    // If intake is already submitted or paid, redirect to appropriate page
    if (intake.status === 'submitted') {
      redirect(`/dashboard/intake/${id}/payment`)
    }

    if (intake.status === 'paid') {
      // Redirect to plan page if payment complete
      redirect(`/dashboard/plans?intake=${id}`)
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sleep Plan Questionnaire</h1>
          <p className="text-gray-600 mt-2">
            Tell us about your baby's sleep so we can create a personalized plan.
          </p>
        </div>

        <IntakeForm babies={babies} intake={intake} />
      </div>
    )
  } catch {
    notFound()
  }
}
