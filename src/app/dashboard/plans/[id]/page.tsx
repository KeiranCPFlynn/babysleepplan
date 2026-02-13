import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, RefreshCw, Star, Moon, BookOpen } from 'lucide-react'
import { PlanContent } from './plan-content'
import { RefreshButton } from './refresh-button'
import { RetryButton } from './retry-button'
import { CancelButton } from './cancel-button'
import { PrintButton } from './print-button'
import { DownloadPdfButton } from './download-pdf-button'
import { RegenerateButton } from './regenerate-button'
import { formatBabyAge } from '@/lib/age'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
const isDevMode = !isStripeEnabled

export default async function PlanViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { id } = await params

  const [{ data: plan, error }, { data: revisions }] = await Promise.all([
    supabase
      .from('plans')
      .select(`
        *,
        baby:babies(name, date_of_birth, temperament)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('plan_revisions')
      .select('id, revision_number, summary, source, week_start, created_at')
      .eq('plan_id', id)
      .eq('user_id', user.id)
      .order('revision_number', { ascending: false }),
  ])

  if (error || !plan) {
    notFound()
  }

  const latestRevision = revisions && revisions.length > 0 ? revisions[0] : null
  const lastDividerIndex = plan.plan_content ? plan.plan_content.lastIndexOf('\n---\n') : -1
  const latestUpdateContent = latestRevision && latestRevision.source !== 'initial' && plan.plan_content
    ? (lastDividerIndex >= 0
        ? plan.plan_content.slice(lastDividerIndex + 5).trim()
        : plan.plan_content)
    : null

  if (plan.status === 'generating') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-purple-100 px-8 py-8 text-center">
            <div className="flex justify-center gap-2 mb-4">
              <Star className="h-5 w-5 text-pink-400" />
              <Moon className="h-6 w-6 text-purple-500" />
              <Star className="h-5 w-5 text-pink-400" />
            </div>
            <h1 className="text-2xl font-bold text-purple-700 mb-2">
              {plan.baby?.name || 'Baby'}&apos;s Sleep Plan
            </h1>
            <p className="text-purple-600 text-sm">
              Creating something special...
            </p>
          </div>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-6">
              <RefreshCw className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
            <p className="text-gray-600 mb-2">
              We&apos;re crafting a personalized plan for {plan.baby?.name || 'your baby'}.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              This usually takes 1-2 minutes.
            </p>
            <div className="flex justify-center gap-4">
              <RefreshButton />
              <RetryButton planId={plan.id} />
              {isDevMode && <CancelButton planId={plan.id} />}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (plan.status === 'failed') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Link>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <h1 className="text-xl font-bold text-red-800">Plan Generation Failed</h1>
            <CardDescription className="text-red-600">
              {plan.error_message || 'An error occurred while generating your plan.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">
              We encountered an issue while creating your plan. You can try again or contact support.
            </p>
            <div className="flex gap-4">
              <RetryButton planId={plan.id} />
              <Button variant="outline" asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-3 print:hidden">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/plans/${plan.id}/diary`}>
              <BookOpen className="mr-2 h-4 w-4" />
              Sleep Diary
            </Link>
          </Button>
          {isDevMode && <RegenerateButton planId={plan.id} />}
          <DownloadPdfButton
            babyName={plan.baby?.name || 'Baby'}
            babyAge={plan.baby?.date_of_birth ? formatBabyAge(plan.baby.date_of_birth) : ''}
            createdDate={new Date(plan.created_at).toLocaleDateString()}
            planContent={plan.plan_content || ''}
          />
          <PrintButton />
        </div>
      </div>

      <Card className="print:shadow-none print:border-none overflow-hidden">
        {/* Baby-friendly header matching PDF design */}
        <div className="bg-purple-100 px-8 py-8 print:bg-purple-50 rounded-b-3xl">
          <div className="flex justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-pink-400" />
            <Moon className="h-6 w-6 text-purple-500" />
            <Star className="h-5 w-5 text-pink-400" />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-purple-500 text-center mb-2">
            LunaCradle Sleep Plan
          </p>
          <h1 className="text-3xl font-bold text-purple-700 text-center mb-2">
            {plan.baby?.name || 'Baby'}&apos;s Sleep Journey
          </h1>
          <p className="text-purple-600 text-sm text-center">
            {plan.baby?.date_of_birth && formatBabyAge(plan.baby.date_of_birth)}
            {plan.baby?.date_of_birth && ' · '}
            Created {new Date(plan.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Welcome message */}
        <div className="mx-8 -mt-4 mb-8 bg-amber-50 border-2 border-amber-200 rounded-xl p-6 print:hidden">
          <p className="text-gray-600 text-base text-center leading-relaxed">
            This plan was made especially for {plan.baby?.name || 'your baby'} and your family.
            Take it one step at a time, trust your instincts, and remember — you&apos;re doing amazing!
          </p>
        </div>

        <CardContent className="py-6 px-8">
          {latestRevision && (
            <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50/60 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-800">
                    Current Revision: {latestRevision.revision_number}
                  </p>
                  <p className="text-xs text-purple-600">
                    {latestRevision.summary || 'Latest plan update'} · {new Date(latestRevision.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/plans/${plan.id}/history/${latestRevision.id}`}>
                    View Revision
                  </Link>
                </Button>
              </div>
              {latestUpdateContent && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    Latest Update
                  </p>
                  <PlanContent content={latestUpdateContent} />
                </div>
              )}
            </div>
          )}
          <PlanContent content={plan.plan_content} />
        </CardContent>

        {/* Footer decoration */}
        <div className="flex justify-center gap-2 pb-6 print:hidden">
          <Star className="h-3 w-3 text-purple-200" />
          <Star className="h-2 w-2 text-pink-300" />
          <Star className="h-3 w-3 text-purple-200" />
        </div>
      </Card>

      {revisions && revisions.length > 0 && (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>Plan History</CardTitle>
            <CardDescription>
              Your plan updates over time. The top entry is the current version.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisions.map((revision, index) => {
              const isCurrent = index === 0
              const createdAt = new Date(revision.created_at).toLocaleDateString()
              const weekLabel = revision.week_start
                ? `Week of ${new Date(revision.week_start + 'T12:00:00').toLocaleDateString()}`
                : null
              return (
                <div key={revision.id} className="flex items-center justify-between gap-4 border rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Revision {revision.revision_number}{isCurrent ? ' · Current' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {revision.summary || weekLabel || 'Plan update'} · {createdAt}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/plans/${plan.id}/history/${revision.id}`}>
                      View
                    </Link>
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {isDevMode && (
        <div className="text-center print:hidden">
          <p className="text-xs text-orange-500 bg-orange-50 inline-block px-4 py-2 rounded-full">
            Dev mode: Regenerate button available above
          </p>
        </div>
      )}
    </div>
  )
}
