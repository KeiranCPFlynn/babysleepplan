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
import { formatUniversalDate } from '@/lib/date-format'

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
  const hasDistinctRevisionHistory = (revisions || []).some((revision) => revision.source !== 'initial')
  const lastDividerIndex = plan.plan_content ? plan.plan_content.lastIndexOf('\n---\n') : -1
  const latestUpdateContent = latestRevision && latestRevision.source !== 'initial' && plan.plan_content
    ? (lastDividerIndex >= 0
        ? plan.plan_content.slice(lastDividerIndex + 5).trim()
        : plan.plan_content)
    : null

  if (plan.status === 'generating') {
    return (
      <div className="dashboard-surface max-w-3xl mx-auto space-y-5 p-5 sm:p-6">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Link>

        <Card className="overflow-hidden border-white/70 bg-white/90 backdrop-blur py-0 gap-0">
          <div className="bg-purple-50 px-8 py-8 text-center dark:bg-purple-900/35">
            <div className="flex justify-center gap-2 mb-4">
              <Star className="h-5 w-5 text-pink-400" />
              <Moon className="h-6 w-6 text-purple-500 dark:text-purple-300" />
              <Star className="h-5 w-5 text-pink-400" />
            </div>
            <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-200 mb-2">
              {plan.baby?.name || 'Baby'}&apos;s Sleep Plan
            </h1>
            <p className="text-purple-600 dark:text-purple-300 text-sm">
              Creating something special...
            </p>
          </div>
          <CardContent className="py-8 text-center">
            <div className="flex justify-center mb-6">
              <RefreshCw className="h-12 w-12 text-purple-400 animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-slate-200 mb-2">
              We&apos;re crafting a personalized plan for {plan.baby?.name || 'your baby'}.
            </p>
            <p className="text-gray-500 dark:text-slate-300 text-sm mb-6">
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
      <div className="dashboard-surface max-w-3xl mx-auto space-y-5 p-5 sm:p-6">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Link>

        <Card className="border-red-200 bg-red-50 dark:border-red-700/60 dark:bg-red-950/35">
          <CardHeader>
            <h1 className="text-xl font-bold text-red-800 dark:text-red-200">Plan Generation Failed</h1>
            <CardDescription className="text-red-600 dark:text-red-300">
              {plan.error_message || 'An error occurred while generating your plan.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700 dark:text-red-200">
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
    <div className="dashboard-surface max-w-5xl mx-auto space-y-5 p-5 sm:p-6">
      <div className="space-y-3 print:hidden">
        <Link
          href="/dashboard/plans"
          className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200"
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
            planId={plan.id}
          />
          <PrintButton />
        </div>
      </div>

      <Card className="print:shadow-none print:border-none overflow-hidden border-white/70 bg-white/90 backdrop-blur py-0 gap-0">
        {/* Baby-friendly header matching PDF design */}
        <div className="bg-purple-50 px-8 py-8 print:bg-purple-50 dark:bg-purple-900/35 rounded-b-3xl">
          <div className="flex justify-center gap-2 mb-4">
            <Star className="h-5 w-5 text-pink-400" />
            <Moon className="h-6 w-6 text-purple-500 dark:text-purple-300" />
            <Star className="h-5 w-5 text-pink-400" />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-purple-500 dark:text-purple-300 text-center mb-2">
            LunaCradle Sleep Plan
          </p>
          <h1 className="text-3xl font-bold text-purple-700 dark:text-purple-200 text-center mb-2">
            {plan.baby?.name || 'Baby'}&apos;s Sleep Journey
          </h1>
          <p className="text-purple-600 dark:text-purple-300 text-sm text-center">
            {plan.baby?.date_of_birth && formatBabyAge(plan.baby.date_of_birth)}
            {plan.baby?.date_of_birth && ' · '}
            Created {formatUniversalDate(plan.created_at)}
          </p>
        </div>

        {/* Welcome message */}
        <div className="mx-8 -mt-4 mb-8 bg-amber-50 border-2 border-orange-200 rounded-xl p-6 print:hidden dark:bg-amber-950/35 dark:border-amber-700/60">
          <p className="text-gray-600 dark:text-slate-200 text-base text-center leading-relaxed">
            This plan is based on what you shared about {plan.baby?.name || 'your baby'} and can be refined as you log sleep.
            Start with one or two changes this week, then adjust based on what the diary shows.
          </p>
        </div>

        <CardContent className="px-5 pb-8 pt-6 md:px-8">
          <div className="mx-auto max-w-3xl">
            {latestRevision && hasDistinctRevisionHistory && (
              <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50/60 px-5 py-4 dark:border-purple-700/60 dark:bg-purple-900/30">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                      Current Revision: {latestRevision.revision_number}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-300">
                      {latestRevision.summary || 'Latest plan update'} · {formatUniversalDate(latestRevision.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        latestRevision.source !== 'initial'
                          ? `/dashboard/plans/${plan.id}/history/${latestRevision.id}#update-details`
                          : `/dashboard/plans/${plan.id}/history/${latestRevision.id}`
                      }
                    >
                      {latestRevision.source !== 'initial' ? 'View Update Details' : 'View Revision'}
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
          </div>
        </CardContent>

        {/* Footer decoration */}
        <div className="flex justify-center gap-2 pb-6 print:hidden">
          <Star className="h-3 w-3 text-purple-200" />
          <Star className="h-2 w-2 text-pink-300" />
          <Star className="h-3 w-3 text-purple-200" />
        </div>
      </Card>

      {revisions && hasDistinctRevisionHistory && (
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
              const createdAt = formatUniversalDate(revision.created_at)
              const weekLabel = revision.week_start
                ? `Week of ${formatUniversalDate(revision.week_start)}`
                : null
              return (
                <div key={revision.id} className="flex items-center justify-between gap-4 border rounded-lg px-4 py-3 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      Revision {revision.revision_number}{isCurrent ? ' · Current' : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-300">
                      {revision.summary || weekLabel || 'Plan update'} · {createdAt}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={
                        revision.source !== 'initial'
                          ? `/dashboard/plans/${plan.id}/history/${revision.id}#update-details`
                          : `/dashboard/plans/${plan.id}/history/${revision.id}`
                      }
                    >
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
          <p className="text-xs text-orange-500 bg-orange-50 inline-block px-4 py-2 rounded-full dark:text-amber-200 dark:bg-amber-900/35">
            Dev mode: Regenerate button available above
          </p>
        </div>
      )}
    </div>
  )
}
