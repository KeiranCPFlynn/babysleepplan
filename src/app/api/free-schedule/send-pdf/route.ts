import { NextRequest, NextResponse } from 'next/server'
import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createClient } from '@supabase/supabase-js'
import {
  freeSchedulePdfIpLimiter,
  freeSchedulePdfEmailDayLimiter,
  getClientIp,
  hashValue,
} from '@/lib/rate-limit'
import { sendFreeScheduleEmail } from '@/lib/email/send-free-schedule'
import { Resend } from 'resend'
import { SleepPlanPDF } from '@/components/pdf/sleep-plan-pdf'
import { formatUniversalDate } from '@/lib/date-format'
import type { ExtractedFields } from '@/lib/free-schedule/types'

export const runtime = 'nodejs'
export const maxDuration = 60

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  // Kill switch
  if (process.env.FREE_SCHEDULE_ENABLED === 'false') {
    return NextResponse.json(
      { success: false, error: 'The free schedule builder is temporarily unavailable.' },
      { status: 503 }
    )
  }

  const isDev = process.env.NODE_ENV === 'development'

  const ip = getClientIp(request)
  const ipHash = hashValue(ip)

  if (!isDev) {
    // In-memory per-IP soft limit (best-effort on serverless)
    const ipCheck = freeSchedulePdfIpLimiter.check(ipHash)
    if (ipCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: 'rate_limited',
          message: 'Too many PDF requests from this location. Please try again tomorrow.',
        },
        { status: 429 }
      )
    }
  }

  let body: { sessionId?: string; email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, email } = body

  if (!sessionId || !email || !isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Session ID and valid email are required.' },
      { status: 400 }
    )
  }

  const emailNormalised = email.toLowerCase().trim()
  const emailHash = hashValue(emailNormalised)

  if (!isDev) {
    // In-memory per-email daily soft limit (best-effort on serverless)
    const emailDayCheck = freeSchedulePdfEmailDayLimiter.check(emailHash)
    if (emailDayCheck.limited) {
      return NextResponse.json(
        {
          success: false,
          error: 'rate_limited',
          message: "You've already received a PDF today. Check back tomorrow.",
        },
        { status: 429 }
      )
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!isDev) {
    // Global daily email cap (DB-backed — survives deploys and multiple serverless instances)
    // Protects Resend costs. Default: 30 emails/day. Override via FREE_SCHEDULE_MAX_DAILY_EMAILS.
    const dailyEmailLimit = parseInt(process.env.FREE_SCHEDULE_MAX_DAILY_EMAILS ?? '30', 10)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count: emailsToday } = await supabase
      .from('free_schedule_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('pdf_sent_at', todayStart.toISOString())

    if ((emailsToday ?? 0) >= dailyEmailLimit) {
      return NextResponse.json(
        {
          success: false,
          error: 'rate_limited',
          message: 'PDF email limit reached for today. Please try again tomorrow.',
        },
        { status: 429 }
      )
    }
  }

  // Fetch session record
  const { data: session, error: sessionError } = await supabase
    .from('free_schedule_sessions')
    .select('report_content, extracted_fields, pdf_sent_at')
    .eq('session_id', sessionId)
    .single()

  if (sessionError || !session?.report_content) {
    return NextResponse.json(
      { success: false, error: 'session_not_found', message: 'Schedule session not found. Please generate a schedule first.' },
      { status: 404 }
    )
  }

  if (!isDev) {
    // Hard block: 3 PDFs per email per 30 days (DB authoritative — survives deploys)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('free_schedule_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('pdf_sent_at', thirtyDaysAgo)

    if (!countError && (count ?? 0) >= 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'rate_limited',
          message: "You've reached the limit of 3 free PDFs per month. Consider upgrading for unlimited access.",
        },
        { status: 429 }
      )
    }
  }

  // Render PDF
  const fields = session.extracted_fields as ExtractedFields
  const ageMonths = fields?.age_months
  const ageLabel =
    ageMonths !== null && ageMonths !== undefined
      ? `${ageMonths} month${ageMonths !== 1 ? 's' : ''} old`
      : ''
  const createdDate = formatUniversalDate(new Date())

  let pdfBytes: Uint8Array
  try {
    const doc = createElement(SleepPlanPDF, {
      babyName: 'Your Baby',
      babyAge: ageLabel,
      createdDate,
      content: session.report_content,
    }) as ReactElement<DocumentProps>

    const pdfBuffer = await renderToBuffer(doc)
    pdfBytes = new Uint8Array(pdfBuffer)
  } catch (err) {
    console.error('PDF render failed:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF. Please try again.' },
      { status: 500 }
    )
  }

  // Send email
  try {
    await sendFreeScheduleEmail(emailNormalised, pdfBytes)
  } catch (err) {
    console.error('Failed to send free schedule email:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to send email. Please try again.' },
      { status: 500 }
    )
  }

  // Add to Resend audience (fire-and-forget — never block or fail the response)
  // Requires RESEND_CONTACTS_API_KEY with full access (the standard sending key is restricted)
  const audienceId = process.env.RESEND_FREE_SCHEDULE_AUDIENCE_ID
  const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY
  if (audienceId && contactsApiKey) {
    new Resend(contactsApiKey).contacts.create({
      email: emailNormalised,
      audienceId,
      unsubscribed: false,
    }).catch((err) => {
      console.error('Failed to add contact to Resend audience:', err)
    })
  }

  // Update session record with email hash and sent timestamp
  await supabase
    .from('free_schedule_sessions')
    .update({
      email_hash: emailHash,
      pdf_sent_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)

  return NextResponse.json({ success: true, message: 'PDF sent! Check your inbox.' })
}
