import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  callOpenAI: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/lib/openai', () => ({
  callOpenAI: mocks.callOpenAI,
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'free_schedule_sessions') {
        return {
          select: () => ({ gte: async () => ({ count: 0 }) }),
          upsert: mocks.upsert,
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  })),
}))

// A valid admin-social schedule: >= 3 unique labels, wake exactly once,
// strictly increasing times, lights out last.
const VALID_ADMIN_SCHEDULE = `## Your Daily Schedule
Here is a calm rhythm for your 8-month-old.

Wake: 7:00 AM
Nap 1: 9:30 AM – 10:30 AM (60 min)
Nap 2: 1:00 PM – 2:00 PM (60 min)
Routine: 6:15 PM
Lights Out: 7:00 PM

## Key Guidance
### Why this works
- Morning anchor
- Age-appropriate wake windows
### What to Track for 3 Days
- Lights out time
- Asleep time
- Night waking count
- Morning wake time

## If/Then Adjustments
If a nap is refused:
- Move bedtime 15 minutes earlier

## Assumptions
Confidence: Medium (assuming two naps per day).

## Next Steps
A fuller adaptive plan can grow with your baby.`

// Duplicate "Wake" label and non-chronological times — must fail validation.
const INVALID_ADMIN_SCHEDULE = `## Your Daily Schedule
Wake: 7:00 AM
Wake: 7:00 AM
Nap 1: 9:30 AM
Lights Out: 8:00 PM

## Key Guidance
### Why this works
- a
- b
### What to Track for 3 Days
- a
- b
- c
- d

## If/Then Adjustments
If x:
- y

## Assumptions
Confidence: Low (test).

## Next Steps
Close.`

const STANDARD_SCHEDULE = `## Your Daily Schedule

| Time | Activity |
|------|----------|
| 7:00 AM | Wake |

## Key Guidance
- Age-appropriate windows

## If/Then Adjustments
**If short nap:** adjust next window

## Assumptions
This schedule assumes a 7am start.

## Next Steps
A full plan adds a step-by-step method.`

function aiResult(text: string) {
  return { text, model: 'gpt-6-luna', status: 'completed', usage: null }
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/free-schedule/generate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
  })
}

const RICH_FIRST_MESSAGE =
  'My 8 month old wakes at 6:30am, bedtime is 7pm, two naps, short naps are the main problem'

describe('free-schedule generate route (OpenAI migration)', () => {
  let POST: typeof import('@/app/api/free-schedule/generate/route').POST

  beforeAll(async () => {
    // Dev mode enables the admin_social output mode and skips the IP rate
    // limit / daily-cap DB checks, neither of which changed in the migration.
    process.env.NODE_ENV = 'development'
    delete process.env.TURNSTILE_SECRET_KEY
    process.env.FREE_SCHEDULE_ENABLED = 'true'
    const mod = await import('@/app/api/free-schedule/generate/route')
    POST = mod.POST
  })

  beforeEach(() => {
    mocks.callOpenAI.mockReset()
    mocks.upsert.mockReset().mockResolvedValue({ error: null })
  })

  it('routes standard generation to the light model and keeps the response shape', async () => {
    mocks.callOpenAI.mockResolvedValue(aiResult(STANDARD_SCHEDULE))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-standard-1',
      questionsAsked: 0,
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('complete')
    expect(data.sessionId).toBe('sess-standard-1')
    expect(data.scheduleMarkdown).toBe(STANDARD_SCHEDULE)
    expect(data.extractedFields.age_months).toBe(8)
    expect(data.extractedFields.wake_time).toBe('06:30')
    expect(data.introMessage).toContain('8-month-old')

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1)
    const options = mocks.callOpenAI.mock.calls[0][0]
    expect(options.role).toBe('light')
    expect(options.timeoutMs).toBe(20000)
    expect(options.maxOutputTokens).toBe(4000)

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'sess-standard-1',
        report_content: STANDARD_SCHEDULE,
      }),
      expect.anything()
    )
  })

  it('returns the error contract when standard generation fails (no fallback)', async () => {
    mocks.callOpenAI.mockRejectedValue(new Error('OpenAI request timed out after 20000ms'))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-standard-fail',
      questionsAsked: 0,
    }))

    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data).toEqual({
      status: 'error',
      error: 'Failed to generate schedule. Please try again.',
    })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it('uses the primary model for admin social and accepts a valid draft', async () => {
    mocks.callOpenAI.mockResolvedValue(aiResult(VALID_ADMIN_SCHEDULE))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-admin-1',
      questionsAsked: 0,
      outputMode: 'admin_social',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('complete')
    expect(data.scheduleMarkdown).toBe(VALID_ADMIN_SCHEDULE)

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1)
    const options = mocks.callOpenAI.mock.calls[0][0]
    expect(options.role).toBe('primary')
    expect(options.timeoutMs).toBe(30000)
    expect(options.maxOutputTokens).toBe(2000)
  })

  it('falls back to the light model when the admin primary call fails', async () => {
    mocks.callOpenAI
      .mockRejectedValueOnce(new Error('OpenAI request timed out after 30000ms'))
      .mockResolvedValueOnce(aiResult(VALID_ADMIN_SCHEDULE))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-admin-fallback',
      questionsAsked: 0,
      outputMode: 'admin_social',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('complete')
    expect(data.scheduleMarkdown).toBe(VALID_ADMIN_SCHEDULE)

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(2)
    expect(mocks.callOpenAI.mock.calls[0][0].role).toBe('primary')
    expect(mocks.callOpenAI.mock.calls[1][0].role).toBe('light')
    expect(mocks.callOpenAI.mock.calls[1][0].timeoutMs).toBe(20000)
  })

  it('repairs an invalid admin draft with the light model', async () => {
    mocks.callOpenAI
      .mockResolvedValueOnce(aiResult(INVALID_ADMIN_SCHEDULE))
      .mockResolvedValueOnce(aiResult(VALID_ADMIN_SCHEDULE))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-admin-repair',
      questionsAsked: 0,
      outputMode: 'admin_social',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('complete')
    // The repaired (valid) draft replaces the invalid primary draft.
    expect(data.scheduleMarkdown).toBe(VALID_ADMIN_SCHEDULE)

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(2)
    expect(mocks.callOpenAI.mock.calls[0][0].role).toBe('primary')
    expect(mocks.callOpenAI.mock.calls[1][0].role).toBe('light')
    expect(mocks.callOpenAI.mock.calls[1][0].timeoutMs).toBe(12000)
    // The repair prompt carries the validation issues and the draft.
    expect(mocks.callOpenAI.mock.calls[1][0].prompt).toContain('Wake must appear exactly once.')
    expect(mocks.callOpenAI.mock.calls[1][0].prompt).toContain(INVALID_ADMIN_SCHEDULE)
  })

  it('keeps the invalid primary draft when the repair also fails validation', async () => {
    mocks.callOpenAI
      .mockResolvedValueOnce(aiResult(INVALID_ADMIN_SCHEDULE))
      .mockResolvedValueOnce(aiResult(INVALID_ADMIN_SCHEDULE))

    const res = await POST(createRequest({
      messages: [{ role: 'user', content: RICH_FIRST_MESSAGE }],
      sessionId: 'sess-admin-repair-fail',
      questionsAsked: 0,
      outputMode: 'admin_social',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('complete')
    expect(data.scheduleMarkdown).toBe(INVALID_ADMIN_SCHEDULE)
  })

  it('keeps the needs_info contract for follow-up questions', async () => {
    // On-topic (sleep word) but no age and too short for AI extraction -> asks for age.
    const res = await POST(createRequest({
      messages: [{ role: 'user', content: 'we need help with sleep' }],
      sessionId: 'sess-followup',
      questionsAsked: 0,
    }))

    const data = await res.json()
    expect(data.status).toBe('needs_info')
    expect(data.followUpQuestion).toContain('How old is your baby?')
    expect(data.questionsAsked).toBe(1)
    expect(mocks.callOpenAI).not.toHaveBeenCalled()
  })
})
