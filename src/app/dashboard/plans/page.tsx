import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { formatUniversalDate } from '@/lib/date-format'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function PlansPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get all plans
  const { data: plans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name, date_of_birth)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get pending intakes (submitted but not paid)
  const { data: pendingIntakes } = await supabase
    .from('intake_submissions')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('updated_at', { ascending: false })

  return (
    <div className="dashboard-surface space-y-8 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-sky-900 dark:text-sky-100">My Sleep Plans</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            View and manage your baby&apos;s personalized sleep plans.
          </p>
        </div>
        <Button asChild className="bg-sky-700 hover:bg-sky-800 self-start sm:self-auto">
          <Link href="/dashboard/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Pending intakes */}
      {pendingIntakes && pendingIntakes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-sky-900 dark:text-sky-100 mb-4">
            {isStripeEnabled ? 'Awaiting Payment' : 'Ready to Generate'}
          </h2>
          <div className="space-y-4">
            {pendingIntakes.map((intake) => (
              <Card
                key={intake.id}
                className="border-amber-200/80 bg-gradient-to-br from-amber-50/85 via-white to-rose-50/65 dark:border-amber-700/60 dark:from-slate-900/70 dark:via-slate-900/75 dark:to-rose-950/25"
              >
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{intake.baby?.name || 'Unknown Baby'}&apos;s Plan</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300">
                        {isStripeEnabled
                          ? 'Questionnaire completed - ready for payment'
                          : 'Questionnaire completed - ready to generate'}
                      </CardDescription>
                    </div>
                    <Button size="sm" asChild className="bg-sky-700 hover:bg-sky-800 self-start sm:self-auto">
                      <Link href={`/dashboard/intake/${intake.id}/payment`}>
                        {isStripeEnabled ? 'Complete Payment' : 'Generate Plan'}
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed plans */}
      {plans && plans.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-sky-900 dark:text-sky-100 mb-4">Your Plans</h2>
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="dashboard-card-soft">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{plan.baby?.name || 'Unknown Baby'}&apos;s Sleep Plan</CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-300">
                        Created {formatUniversalDate(plan.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/35 dark:text-green-200'
                            : plan.status === 'generating'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/35 dark:text-blue-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/35 dark:text-red-200'
                        }`}
                      >
                        {plan.status === 'generating' ? 'Generating...' : plan.status}
                      </span>
                      {plan.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="border-sky-200 bg-white/80 text-slate-700 hover:bg-sky-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-700/70"
                        >
                          <Link href={`/dashboard/plans/${plan.id}`}>View Plan</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {plan.status === 'failed' && plan.error_message && (
                  <CardContent>
                    <p className="text-sm text-red-600 dark:text-red-300">{plan.error_message}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-rose-50/70 dark:border-slate-700 dark:from-slate-900/70 dark:via-slate-900/75 dark:to-rose-950/25">
          <CardHeader>
            <CardTitle className="text-sky-900 dark:text-sky-100">No Plans Yet</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">
              You haven&apos;t created any sleep plans yet. Start by completing a questionnaire
              about your baby&apos;s sleep habits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-sky-700 hover:bg-sky-800">
              <Link href="/dashboard/intake/new">Create Your First Plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
