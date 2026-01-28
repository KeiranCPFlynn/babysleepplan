import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Sleep Plans</h1>
          <p className="text-gray-600 mt-2">
            View and manage your baby's personalized sleep plans.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </Link>
        </Button>
      </div>

      {/* Pending intakes */}
      {pendingIntakes && pendingIntakes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isStripeEnabled ? 'Awaiting Payment' : 'Ready to Generate'}
          </h2>
          <div className="space-y-4">
            {pendingIntakes.map((intake) => (
              <Card key={intake.id} className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{intake.baby?.name || 'Unknown Baby'}'s Plan</CardTitle>
                      <CardDescription>
                        {isStripeEnabled
                          ? 'Questionnaire completed - ready for payment'
                          : 'Questionnaire completed - ready to generate'}
                      </CardDescription>
                    </div>
                    <Button size="sm" asChild>
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
          <h2 className="text-xl font-semibold mb-4">Your Plans</h2>
          <div className="space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.baby?.name || 'Unknown Baby'}'s Sleep Plan</CardTitle>
                      <CardDescription>
                        Created {new Date(plan.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          plan.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : plan.status === 'generating'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {plan.status === 'generating' ? 'Generating...' : plan.status}
                      </span>
                      {plan.status === 'completed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/plans/${plan.id}`}>View Plan</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {plan.status === 'failed' && plan.error_message && (
                  <CardContent>
                    <p className="text-sm text-red-600">{plan.error_message}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Plans Yet</CardTitle>
            <CardDescription>
              You haven't created any sleep plans yet. Start by completing a questionnaire
              about your baby's sleep habits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/intake/new">Create Your First Plan</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
