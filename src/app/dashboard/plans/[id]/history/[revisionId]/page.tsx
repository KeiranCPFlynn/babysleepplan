import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanContent } from '../../plan-content'

export default async function PlanRevisionPage({
  params,
}: {
  params: Promise<{ id: string; revisionId: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()
  const { id, revisionId } = await params

  const { data: revision, error } = await supabase
    .from('plan_revisions')
    .select('*')
    .eq('id', revisionId)
    .eq('plan_id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !revision) {
    notFound()
  }

  const { data: previousRevision } = revision.revision_number > 1
    ? await supabase
        .from('plan_revisions')
        .select('plan_content')
        .eq('plan_id', id)
        .eq('user_id', user.id)
        .eq('revision_number', revision.revision_number - 1)
        .single()
    : { data: null }

  const createdAt = new Date(revision.created_at).toLocaleDateString()
  const weekLabel = revision.week_start
    ? `Week of ${new Date(revision.week_start + 'T12:00:00').toLocaleDateString()}`
    : null

  let updateContent: string | null = null
  if (revision.source !== 'initial') {
    const previousContent = previousRevision?.plan_content || ''
    if (previousContent && revision.plan_content.startsWith(previousContent)) {
      updateContent = revision.plan_content.slice(previousContent.length)
    } else {
      const dividerIndex = revision.plan_content.lastIndexOf('\n---\n')
      if (dividerIndex >= 0) {
        updateContent = revision.plan_content.slice(dividerIndex + 5)
      } else {
        const markerIndex = revision.plan_content.lastIndexOf('## Plan Update')
        if (markerIndex >= 0) {
          updateContent = revision.plan_content.slice(markerIndex)
        } else {
          updateContent = revision.plan_content
        }
      }
    }
    updateContent = updateContent?.replace(/^\s*---\s*/g, '').trim() ?? null
    if (!updateContent) {
      updateContent = null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/dashboard/plans/${id}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Plan
      </Link>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-purple-50">
          <CardTitle>Plan Revision {revision.revision_number}</CardTitle>
          <CardDescription>
            {revision.summary || weekLabel || 'Plan update'} · {createdAt}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6 px-8">
          <PlanContent content={revision.plan_content} />
        </CardContent>
      </Card>

      {revision.source !== 'initial' && (
        <Card className="border-emerald-100 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-900">Changes in this update</CardTitle>
            <CardDescription className="text-emerald-700">
              The newest section added in this revision.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-6">
            {updateContent ? (
              <PlanContent content={updateContent} />
            ) : (
              <p className="text-sm text-emerald-800">
                No isolated update section was found for this revision.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
