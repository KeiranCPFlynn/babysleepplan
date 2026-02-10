import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { SuccessClient } from './success-client'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string; dev_mode?: string }>
}) {
  await requireAuth()

  const { id } = await params
  const { dev_mode } = await searchParams

  const supabase = await createClient()

  // Get intake with baby info
  const { data: intake } = await supabase
    .from('intake_submissions')
    .select('*, baby:babies(name)')
    .eq('id', id)
    .single()

  if (!intake) {
    redirect('/dashboard')
  }

  // Get the plan if it exists
  const { data: plan } = await supabase
    .from('plans')
    .select('id, status')
    .eq('intake_submission_id', id)
    .single()

  const isDevMode = dev_mode === 'true' || !isStripeEnabled

  return (
    <SuccessClient
      intakeId={id}
      babyName={intake.baby?.name || 'Baby'}
      isDevMode={isDevMode}
      initialPlan={plan ? { id: plan.id, status: plan.status } : null}
    />
  )
}
