// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FreeScheduleClient } from '@/app/free-schedule/free-schedule-client'
import { EmailGate } from '@/components/free-schedule/email-gate'

vi.mock('@/components/free-schedule/schedule-preview', () => ({
  SchedulePreview: ({ markdown }: { markdown: string }) => <p>{markdown}</p>,
}))

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const DESCRIPTION = 'My baby is 8 months, wakes at 7am and takes two short naps. Bedtime is 7pm.'
const fetchMock = vi.fn()
const gtag = vi.fn()

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, json: async () => body }
}

function complete() {
  return response({
    status: 'complete',
    sessionId: 'qa-local-session',
    scheduleMarkdown: 'A generated daily schedule',
    extractedFields: { age_months: 8, confidence_score: 1, assumptions: [] },
  })
}

function send(text = DESCRIPTION) {
  fireEvent.change(screen.getByRole('textbox', { name: "Your baby's sleep situation" }), {
    target: { value: text },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send' }))
}

function events(name: string) {
  return gtag.mock.calls.filter((args) => args[1] === name)
}

beforeEach(() => {
  fetchMock.mockReset()
  gtag.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  window.gtag = gtag
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  delete window.gtag
})

describe('free schedule journey', () => {
  it('counts a successful preview once, focuses it, and removes the inactive chat input', async () => {
    let resolveRequest!: (value: ReturnType<typeof response>) => void
    fetchMock.mockReturnValue(new Promise((resolve) => { resolveRequest = resolve }))
    render(<FreeScheduleClient />)
    send()
    expect(events('free_schedule_first_message')).toHaveLength(1)
    expect(events('free_schedule_report_generated')).toHaveLength(0)

    resolveRequest(complete())
    await screen.findByText('A generated daily schedule')
    expect(events('free_schedule_report_generated')).toEqual([
      ['event', 'free_schedule_report_generated', { free_schedule: true }],
    ])
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Your generated schedule')
    expect(screen.queryByRole('textbox', { name: "Your baby's sleep situation" })).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/age_months|confidence_score|qa-local-session|8 months|7am/)
  })

  it('keeps retries available without inflating starts or reporting a failed generation as success', async () => {
    fetchMock.mockResolvedValueOnce(response({ status: 'error', error: 'Please try again.' }, 500))
      .mockResolvedValueOnce(complete())
    render(<FreeScheduleClient />)
    send()
    await screen.findByText('Please try again.')
    expect(events('free_schedule_error')).toEqual([['event', 'free_schedule_error', { reason: 'generation' }]])
    expect(events('free_schedule_report_generated')).toHaveLength(0)

    send()
    await screen.findByText('A generated daily schedule')
    expect(events('free_schedule_first_message')).toHaveLength(1)
    expect(events('free_schedule_report_generated')).toHaveLength(1)
  })

  it('records a clarification and successful result as one journey', async () => {
    fetchMock.mockResolvedValueOnce(response({
      status: 'needs_info', followUpQuestion: 'What time do they wake?',
      questionsAsked: 1, quickReplies: ['7:00–7:30am'],
    })).mockResolvedValueOnce(complete())
    render(<FreeScheduleClient />)
    send('My baby is 8 months and has short naps.')
    await screen.findByText('What time do they wake?')
    expect(events('free_schedule_follow_up')).toEqual([['event', 'free_schedule_follow_up', { question_number: 1 }]])
    fireEvent.click(screen.getByRole('button', { name: '7:00–7:30am' }))
    await screen.findByText('A generated daily schedule')
    expect(events('free_schedule_first_message')).toHaveLength(1)
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).questionsAsked).toBe(1)
  })

  it('shows the actual daily-limit message on HTTP 429 and records a bounded reason', async () => {
    fetchMock.mockResolvedValue(response({ status: 'rate_limited', message: 'Please return tomorrow.' }, 429))
    render(<FreeScheduleClient />)
    send()
    await screen.findByText('Please return tomorrow.')
    expect(events('free_schedule_error')).toEqual([['event', 'free_schedule_error', { reason: 'rate_limited' }]])
    expect(events('free_schedule_report_generated')).toHaveLength(0)
  })

  it.each([
    [new TypeError('Network unavailable'), 'network'],
    [new DOMException('Aborted', 'AbortError'), 'timeout'],
  ])('keeps failed requests visible and retryable (%s)', async (error, reason) => {
    fetchMock.mockRejectedValue(error)
    render(<FreeScheduleClient />)
    send()
    await waitFor(() => expect(events('free_schedule_error')).toEqual([['event', 'free_schedule_error', { reason }]]))
    expect(screen.getByRole('textbox', { name: "Your baby's sleep situation" })).toHaveProperty('disabled', false)
    expect(events('free_schedule_report_generated')).toHaveLength(0)
  })

  it('does not count rejected off-topic input or an unfinished bot check as a start', () => {
    render(<FreeScheduleClient turnstileSiteKey="qa-site-key" />)
    send('hello')
    send()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(gtag).not.toHaveBeenCalled()
    expect(screen.getByText(/bot verification finishes/)).toBeTruthy()
  })
})

describe('email boundary with mocked delivery only', () => {
  it.each([true, false])('unlocks and records PDF success only after confirmed delivery (success: %s)', async (success) => {
    fetchMock.mockResolvedValue(response({ success }, success ? 200 : 500))
    const onSuccess = vi.fn()
    render(<EmailGate sessionId="qa-local-session" onSuccess={onSuccess} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), { target: { value: 'qa@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Email me the PDF' }))
    await waitFor(() => expect(events('free_schedule_email_submitted')).toHaveLength(1))
    await waitFor(() => expect(screen.queryByText('Sending…')).toBeNull())
    expect(onSuccess).toHaveBeenCalledTimes(success ? 1 : 0)
    expect(events('free_schedule_pdf_sent')).toHaveLength(success ? 1 : 0)
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/qa@example.com|qa-local-session/)
  })
})
