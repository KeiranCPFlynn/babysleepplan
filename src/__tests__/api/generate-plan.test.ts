import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  callOpenAI: vi.fn(),
  rpc: vi.fn(),
  planSingle: vi.fn(),
  babySingle: vi.fn(),
  intakeSingle: vi.fn(),
  revisionMaybeSingle: vi.fn(),
  revisionInsert: vi.fn(),
}))

vi.mock('@/lib/openai', () => ({
  callOpenAI: mocks.callOpenAI,
  // Mirrors the real classification's first branch: trust the retryable flag
  // attached to helper errors. The real logic is unit-tested in openai.test.ts.
  isOpenAIRetryableError: (error: unknown) =>
    Boolean(error && typeof error === 'object' && (error as { retryable?: boolean }).retryable),
}))

const plansUpdateCalls: Array<Record<string, unknown>> = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: mocks.rpc,
    from: (table: string) => {
      if (table === 'plans') {
        return {
          select: () => ({
            eq: () => ({ single: mocks.planSingle }),
          }),
          update: (payload: Record<string, unknown>) => {
            plansUpdateCalls.push(payload)
            return { eq: async () => ({ error: null }) }
          },
        }
      }
      if (table === 'babies') {
        return { select: () => ({ eq: () => ({ single: mocks.babySingle }) }) }
      }
      if (table === 'intake_submissions') {
        return { select: () => ({ eq: () => ({ single: mocks.intakeSingle }) }) }
      }
      if (table === 'plan_revisions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({ limit: () => ({ maybeSingle: mocks.revisionMaybeSingle }) }),
            }),
          }),
          insert: mocks.revisionInsert,
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  })),
}))

import { POST } from '@/app/api/generate-plan/route'

const INTERNAL_KEY = 'test-internal-key'

function monthsAgo(months: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date.toISOString().slice(0, 10)
}

function retryableError(message = 'OpenAI server error') {
  return Object.assign(new Error(message), { retryable: true })
}

function permanentError(message = 'OpenAI authentication error') {
  return Object.assign(new Error(message), { retryable: false })
}

function createRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/generate-plan', {
    method: 'POST',
    body: JSON.stringify({ planId: 'plan-1' }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${INTERNAL_KEY}`,
    },
  })
}

beforeAll(() => {
  process.env.INTERNAL_API_KEY = INTERNAL_KEY
})

beforeEach(() => {
  mocks.callOpenAI.mockReset()
  plansUpdateCalls.length = 0

  mocks.planSingle.mockResolvedValue({
    data: {
      id: 'plan-1',
      status: 'pending',
      baby_id: 'baby-1',
      intake_submission_id: 'intake-1',
      user_id: 'user-1',
      plan_content: null,
    },
    error: null,
  })
  mocks.babySingle.mockResolvedValue({
    data: {
      name: 'Nova',
      date_of_birth: monthsAgo(8),
      premature_weeks: 0,
      temperament: 'easy',
      temperament_notes: null,
      medical_conditions: null,
    },
    error: null,
  })
  mocks.intakeSingle.mockResolvedValue({
    data: {
      problems: ['short_naps'],
      crying_comfort_level: 2,
      falling_asleep_method: 'nursing',
      nap_method: null,
      nap_location: 'crib',
      nap_duration: '30_60',
      nap_count: 2,
      night_wakings_count: 2,
      night_wakings_description: null,
      night_waking_pattern: null,
      night_waking_duration: '5_10',
      problem_description: null,
      parent_constraints: null,
      additional_notes: null,
      success_description: null,
      medical_conditions: null,
      current_bedtime: '19:30',
      current_waketime: '06:30',
      data: null,
    },
    error: null,
  })
  mocks.revisionMaybeSingle.mockResolvedValue({ data: null })
  mocks.revisionInsert.mockResolvedValue({ error: null })
  mocks.rpc.mockResolvedValue({ data: true, error: null })
})

describe('generate-plan route (OpenAI migration)', () => {
  it('generates via the primary role and saves plan plus initial revision', async () => {
    mocks.callOpenAI.mockResolvedValue({
      text: `# Nova's Sleep Plan\n\n## Your Plan at a Glance\nWarm words here.`,
      model: 'gpt-6.1-sol',
      status: 'completed',
      usage: { inputTokens: 8000, outputTokens: 2000, reasoningTokens: 400, cachedTokens: 0, totalTokens: 10000 },
    })

    const res = await POST(createRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, planId: 'plan-1' })

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1)
    const options = mocks.callOpenAI.mock.calls[0][0]
    expect(options.role).toBe('primary')
    expect(options.timeoutMs).toBe(100000)
    expect(options.maxOutputTokens).toBe(16000)
    // Baby name is sanitized (wrapped) before prompt interpolation.
    expect(options.prompt).toContain('<user_input>Nova</user_input>')
    expect(options.prompt).toContain('expert pediatric sleep consultant')

    const completed = plansUpdateCalls.find((c) => c.status === 'completed')
    expect(completed).toBeDefined()
    expect(String(completed!.plan_content)).toContain("# Nova's Sleep Plan")
    // Evidence appendix from the loaded knowledge files is preserved.
    expect(String(completed!.plan_content).length).toBeGreaterThan("# Nova's Sleep Plan".length)

    expect(mocks.revisionInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan-1',
        revision_number: 1,
        source: 'initial',
        summary: 'Initial plan',
      })
    )
    expect(mocks.rpc).toHaveBeenCalledWith('release_plan_generation_lock', expect.anything())
  })

  it('retries once on a retryable failure and succeeds on the second attempt', async () => {
    mocks.callOpenAI
      .mockRejectedValueOnce(retryableError())
      .mockResolvedValueOnce({
        text: '# Plan after retry',
        model: 'gpt-6.1-sol',
        status: 'completed',
        usage: null,
      })

    const res = await POST(createRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true, planId: 'plan-1' })
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(2)
    expect(plansUpdateCalls.some((c) => c.status === 'completed')).toBe(true)
  }, 15000)

  it('is bounded to two attempts when every attempt fails retryably', async () => {
    mocks.callOpenAI.mockRejectedValue(retryableError())

    const res = await POST(createRequest())

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'An unexpected error occurred' })
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(2)
    expect(plansUpdateCalls.some((c) => c.status === 'completed')).toBe(false)
    expect(plansUpdateCalls.some((c) => c.status === 'failed')).toBe(true)
    expect(mocks.rpc).toHaveBeenCalledWith('release_plan_generation_lock', expect.anything())
  }, 15000)

  it('does not retry permanent errors such as authentication failures', async () => {
    mocks.callOpenAI.mockRejectedValue(permanentError())

    const res = await POST(createRequest())

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'An unexpected error occurred' })
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1)
    expect(plansUpdateCalls.some((c) => c.status === 'completed')).toBe(false)
  })

  it('does not save a plan when the model returns empty text', async () => {
    mocks.callOpenAI.mockRejectedValue(
      Object.assign(new Error('OpenAI returned an empty response text'), { retryable: false })
    )

    const res = await POST(createRequest())

    expect(res.status).toBe(500)
    expect(plansUpdateCalls.some((c) => c.status === 'completed')).toBe(false)
  })
})
