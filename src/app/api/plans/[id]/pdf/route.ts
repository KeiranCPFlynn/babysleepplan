import { NextResponse } from 'next/server'
import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { formatBabyAge } from '@/lib/age'
import { formatUniversalDate } from '@/lib/date-format'
import { SleepPlanPDF } from '@/components/pdf/sleep-plan-pdf'

export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select(`
        created_at,
        plan_content,
        baby:babies(name, date_of_birth)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const baby = Array.isArray(plan.baby) ? plan.baby[0] : plan.baby
    const babyName = baby?.name || 'Baby'
    const babyAge = baby?.date_of_birth ? formatBabyAge(baby.date_of_birth) : ''
    const createdDate = formatUniversalDate(plan.created_at)
    const content = plan.plan_content || ''

    if (!content.trim()) {
      return NextResponse.json({ error: 'Plan content is empty' }, { status: 400 })
    }

    const doc = createElement(SleepPlanPDF, {
      babyName,
      babyAge,
      createdDate,
      content,
    }) as ReactElement<DocumentProps>
    const pdfBuffer = await renderToBuffer(doc)
    const pdfBytes = new Uint8Array(pdfBuffer)

    const safeFileName = babyName.replace(/[^a-z0-9]/gi, '_') || 'sleep_plan'

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}_Sleep_Plan.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('PDF route error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
