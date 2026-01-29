import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Baby, FileText, Plus, BookOpen } from 'lucide-react'
import { DeleteIntakeButton } from './delete-intake-button'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get counts
  const { count: babyCount } = await supabase
    .from('babies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: planCount } = await supabase
    .from('plans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get recent plans
  const { data: recentPlans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Get completed plans for daily diary prompt
  const { data: completedPlans } = await supabase
    .from('plans')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  const todayStr = new Date().toISOString().split('T')[0]
  const completedPlanIds = (completedPlans || []).map((plan) => plan.id)
  const { data: todaysDiaryEntries } = completedPlanIds.length > 0
    ? await supabase
        .from('sleep_diary_entries')
        .select('id, plan_id')
        .eq('user_id', user.id)
        .eq('date', todayStr)
        .in('plan_id', completedPlanIds)
    : { data: [] }
  const todaysEntryPlanIds = new Set((todaysDiaryEntries || []).map((entry) => entry.plan_id))

  // Get draft intakes
  const { data: draftIntakes } = await supabase
    .from('intake_submissions')
    .select(`
      *,
      baby:babies(name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-gray-600">
          Manage your babies and sleep plans from here.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Babies</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{babyCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {babyCount === 1 ? 'Baby registered' : 'Babies registered'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sleep Plans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {planCount === 1 ? 'Plan created' : 'Plans created'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {profile?.subscription_status || 'Inactive'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current plan status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/intake/new">
            <Plus className="mr-2 h-4 w-4" />
            Create New Plan
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/babies/new">
            <Baby className="mr-2 h-4 w-4" />
            Add Baby
          </Link>
        </Button>
      </div>

      {/* Daily diary prompt */}
      {completedPlans && completedPlans.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700">
              Log today&apos;s sleep
            </CardTitle>
            <CardDescription className="text-purple-600">
              Choose a plan to log today&apos;s entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedPlans.map((plan) => {
              const hasEntry = todaysEntryPlanIds.has(plan.id)
              return (
                <div key={plan.id} className="flex items-center justify-between gap-4 rounded-lg bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-purple-900">
                      {plan.baby?.name || 'Baby'}&apos;s Plan
                    </p>
                    <p className="text-xs text-purple-600">
                      {hasEntry ? 'Logged today' : 'Not logged yet'}
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant={hasEntry ? 'outline' : 'default'}
                    className={hasEntry ? '' : 'bg-purple-600 hover:bg-purple-700'}
                  >
                    <Link href={`/dashboard/plans/${plan.id}/diary?date=${todayStr}`}>
                      {hasEntry ? 'View / Edit' : 'Log Today'}
                    </Link>
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Draft intakes */}
      {draftIntakes && draftIntakes.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Continue Your Questionnaire</h2>
          <div className="space-y-4">
            {draftIntakes.map((intake) => (
              <Card key={intake.id} className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{intake.baby?.name || 'Unknown Baby'}&apos;s Questionnaire</CardTitle>
                      <CardDescription>
                        Last updated {new Date(intake.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        In Progress
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/intake/${intake.id}`}>
                          Continue
                        </Link>
                      </Button>
                      <DeleteIntakeButton
                        intakeId={intake.id}
                        babyName={intake.baby?.name || 'Unknown Baby'}
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent plans */}
      {recentPlans && recentPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Plans</h2>
          <div className="space-y-4">
            {recentPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.baby?.name || 'Baby'}&apos;s Sleep Plan</CardTitle>
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
                        {plan.status}
                      </span>
                      {plan.status === 'completed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/plans/${plan.id}/diary`}>
                            <BookOpen className="mr-1 h-3 w-3" />
                            Diary
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/plans/${plan.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No plans message */}
      {(!recentPlans || recentPlans.length === 0) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription className="text-gray-700">
              {babyCount === 0
                ? "Create your personalized sleep plan in 3 easy steps: Add your baby's info, answer a few questions about their sleep, and get your custom plan."
                : "You haven't created any sleep plans yet. Answer a few questions about your baby's sleep to get personalized guidance."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="lg">
              <Link href="/dashboard/intake/new">
                {babyCount === 0 ? 'Get Started' : 'Create Your First Plan'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
