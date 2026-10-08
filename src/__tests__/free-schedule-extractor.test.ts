import { describe, it, expect, beforeEach, vi } from 'vitest'

const callOpenAIMock = vi.fn()

vi.mock('@/lib/openai', () => ({
  callOpenAI: (...args: unknown[]) => callOpenAIMock(...args),
}))

import {
  extractFieldsFromText,
  extractFieldsWithAI,
  mergeFields,
} from '@/lib/free-schedule/extractor'

function aiResult(text: string) {
  return { text, model: 'gpt-6-luna', status: 'completed', usage: null }
}

beforeEach(() => {
  callOpenAIMock.mockReset()
})

describe('heuristic extraction (unchanged behaviour)', () => {
  it('extracts age, wake time, bedtime, naps and issue from free text', () => {
    const fields = extractFieldsFromText(
      'My 8 month old wakes at 6:30am, bedtime is 7pm, two naps of 30-45 min, short naps are the problem'
    )

    expect(fields.age_months).toBe(8)
    expect(fields.wake_time).toBe('06:30')
    expect(fields.bedtime).toBe('19:00')
    expect(fields.naps_count).toBe(2)
    expect(fields.nap_lengths).toBe('30–45 min')
    expect(fields.main_issue).toBe('short naps')
    expect(fields.confidence_score).toBeCloseTo(1.0, 2)
  })

  it('returns empty fields with zero confidence for unrelated text', () => {
    const fields = extractFieldsFromText('Hello there, how is the weather?')

    expect(fields.age_months).toBeNull()
    expect(fields.wake_time).toBeNull()
    expect(fields.bedtime).toBeNull()
    expect(fields.naps_count).toBeNull()
    expect(fields.nap_lengths).toBeNull()
    expect(fields.main_issue).toBeNull()
    expect(fields.confidence_score).toBe(0)
  })

  it('merges incoming values over existing and keeps max confidence', () => {
    const existing = extractFieldsFromText('bedtime 7pm')
    const incoming = extractFieldsFromText('9 month old wakes at 6am')

    const merged = mergeFields(existing, incoming)

    expect(merged.age_months).toBe(9)
    expect(merged.wake_time).toBe('06:00')
    expect(merged.bedtime).toBe('19:00')
    expect(merged.confidence_score).toBe(
      Math.max(incoming.confidence_score, existing.confidence_score)
    )
  })
})

describe('AI extraction fallback (extractFieldsWithAI)', () => {
  it('parses a plain JSON response and recalculates confidence', async () => {
    callOpenAIMock.mockResolvedValue(
      aiResult(
        '{"age_months": 11, "wake_time": "06:45", "bedtime": "19:15", "naps_count": 2, "nap_lengths": "45 min", "main_issue": "frequent night wakings"}'
      )
    )

    const fields = await extractFieldsWithAI('our baby is 11 months, wakes 6:45, hard nights')

    expect(callOpenAIMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'light', maxOutputTokens: 1000 })
    )
    expect(fields).toEqual({
      age_months: 11,
      wake_time: '06:45',
      bedtime: '19:15',
      naps_count: 2,
      nap_lengths: '45 min',
      main_issue: 'frequent night wakings',
      confidence_score: 1.0,
      assumptions: [],
    })
  })

  it('strips markdown code fences around the JSON', async () => {
    callOpenAIMock.mockResolvedValue(
      aiResult('```json\n{"age_months": 6, "wake_time": null, "bedtime": null, "naps_count": null, "nap_lengths": null, "main_issue": null}\n```')
    )

    const fields = await extractFieldsWithAI('six month old')
    expect(fields.age_months).toBe(6)
    expect(fields.wake_time).toBeNull()
    expect(fields.confidence_score).toBe(0.5)
  })

  it('returns empty fields when the model returns malformed JSON', async () => {
    callOpenAIMock.mockResolvedValue(aiResult('sorry, I cannot answer that'))

    const fields = await extractFieldsWithAI('garbage in')
    expect(fields.age_months).toBeNull()
    expect(fields.confidence_score).toBe(0)
  })

  it('returns empty fields when the AI call fails (empty-field fallback)', async () => {
    callOpenAIMock.mockRejectedValue(new Error('OpenAI request timed out after 15000ms'))

    const fields = await extractFieldsWithAI('eight month old, night wakings')
    expect(fields).toEqual({
      age_months: null,
      wake_time: null,
      bedtime: null,
      naps_count: null,
      nap_lengths: null,
      main_issue: null,
      confidence_score: 0,
      assumptions: [],
    })
  })
})
