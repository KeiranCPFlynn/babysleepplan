import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'

export default async function CurrentPlanRedirectPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('plans')
    .select('id, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!plans || plans.length === 0) {
    redirect('/dashboard/plans')
  }

  const preferredPlan = plans.find((plan) => plan.status === 'completed') || plans[0]
  redirect(`/dashboard/plans/${preferredPlan.id}`)
}
