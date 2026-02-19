import { getFlashModel } from '@/lib/gemini'
import { sanitizeForPrompt } from '@/lib/sanitize'
import type { ExtractedFields } from './types'

function normalizeTime(hour: string, minute?: string, meridiem?: string): string {
  let h = parseInt(hour, 10)
  const m = parseInt(minute || '0', 10)

  if (meridiem?.toLowerCase() === 'pm' && h < 12) h += 12
  if (meridiem?.toLowerCase() === 'am' && h === 12) h = 0

  // Heuristic: without meridiem, treat 1–5 as PM (bedtime range), 6–11 as AM (wake range)
  if (!meridiem) {
    if (h >= 1 && h <= 5) h += 12
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function extractAge(text: string): number | null {
  // Months: "8 months", "8mo", "8m old"
  const monthMatch = text.match(/\b(\d{1,2})\s*(?:month|months|mo\b)/i)
  if (monthMatch) return parseInt(monthMatch[1], 10)

  // Weeks: "12 weeks", "12wk"
  const weekMatch = text.match(/\b(\d{1,3})\s*(?:week|weeks|wk\b)/i)
  if (weekMatch) return Math.floor(parseInt(weekMatch[1], 10) / 4.33)

  // Years: "2 years", "2yr"
  const yearMatch = text.match(/\b(\d{1,2})\s*(?:year|years|yr\b)/i)
  if (yearMatch) return parseInt(yearMatch[1], 10) * 12

  return null
}

function extractTime(text: string, contextPatterns: RegExp[]): string | null {
  const timePattern = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i

  for (const context of contextPatterns) {
    const combined = new RegExp(context.source + '\\s*' + timePattern.source, 'i')
    const match = text.match(combined)
    if (match) {
      return normalizeTime(match[1], match[2], match[3])
    }
  }
  return null
}

function extractNapCount(text: string): number | null {
  if (/\bno\s+nap/i.test(text)) return 0
  if (/\bone\s+nap|\b1\s*(?:x\s*)?nap\b/i.test(text)) return 1
  if (/\btwo\s+naps|\b2\s*(?:x\s*)?naps?\b/i.test(text)) return 2
  if (/\bthree\s+naps|\b3\s*(?:x\s*)?naps?\b/i.test(text)) return 3
  if (/\bfour\s+naps|\b4\s*(?:x\s*)?naps?\b/i.test(text)) return 4

  const match = text.match(/\b(\d)\s*(?:x\s*)?naps?\b/i)
  if (match) return parseInt(match[1], 10)

  return null
}

function extractNapLength(text: string): string | null {
  // "30-45 min naps", "naps for 30 minutes", "30 minute naps"
  const rangeMatch = text.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})\s*min/i)
  if (rangeMatch) return `${rangeMatch[1]}–${rangeMatch[2]} min`

  const singleMatch = text.match(/(\d{2,3})\s*min(?:ute)?s?\s*nap/i)
  if (singleMatch) return `${singleMatch[1]} min`

  const napForMatch = text.match(/nap(?:s)?\s+(?:for|of)\s+(\d{2,3})\s*min/i)
  if (napForMatch) return `${napForMatch[1]} min`

  return null
}

function extractMainIssue(text: string): string | null {
  const issueMap: Array<[RegExp, string]> = [
    [/(?:night\s+wak|wakes?\s+(?:every|through|all\s+night)|frequent\s+wak)/i, 'frequent night wakings'],
    [/(?:won't\s+sleep|can't\s+sleep|won't\s+(?:go|fall)\s+asleep|resist(?:s)?\s+(?:sleep|bedtime)|bedtime\s+battle)/i, 'hard to settle at bedtime'],
    [/(?:early\s+wak|up\s+(?:before|at)\s+[45]|wakes?\s+too\s+early)/i, 'early morning waking'],
    // Match both "short naps" and "naps (are/very) short" word orders
    [/(?:short\s+nap|nap\S*\s+(?:are\s+)?(?:too\s+|very\s+)?short|longer\s+nap|catnap|cat\s+nap|45\s*[-–]?\s*min(?:ute)?\s*nap)/i, 'short naps'],
    [/(?:nap\s+refus|won't\s+nap|resists?\s+nap)/i, 'nap resistance'],
  ]

  for (const [pattern, label] of issueMap) {
    if (pattern.test(text)) return label
  }
  return null
}

export function extractFieldsFromText(text: string): ExtractedFields {
  const fields: ExtractedFields = {
    age_months: null,
    wake_time: null,
    bedtime: null,
    naps_count: null,
    nap_lengths: null,
    main_issue: null,
    confidence_score: 0,
    assumptions: [],
  }

  fields.age_months = extractAge(text)

  fields.wake_time = extractTime(text, [
    /(?:wake[s]?\s*(?:up)?(?:\s*time)?(?:\s*(?:is|at|around))?|up\s+at|gets?\s+up\s+(?:at|around)|morning\s+wake(?:\s*time)?(?:\s*(?:is|at))?)/i,
  ])
  // Discard wake times that fall in the night range (11pm–5am) — almost certainly night wakings
  if (fields.wake_time) {
    const [h] = fields.wake_time.split(':').map(Number)
    if (h >= 23 || h < 5) fields.wake_time = null
  }

  fields.bedtime = extractTime(text, [
    /(?:bed(?:time)?(?:\s*(?:is|at|around))?|goes?\s+to\s+(?:bed|sleep)(?:\s+(?:at|around))?|down\s+(?:at|around)|sleep\s+time(?:\s*(?:is|at))?)/i,
  ])

  fields.naps_count = extractNapCount(text)
  fields.nap_lengths = extractNapLength(text)
  fields.main_issue = extractMainIssue(text)

  // Confidence score
  let score = 0
  if (fields.age_months !== null) score += 0.5
  if (fields.wake_time !== null) score += 0.25
  if (fields.bedtime !== null) score += 0.1
  if (fields.naps_count !== null) score += 0.1
  if (fields.main_issue !== null) score += 0.05
  fields.confidence_score = score

  return fields
}

export function mergeFields(
  existing: ExtractedFields,
  incoming: ExtractedFields
): ExtractedFields {
  return {
    age_months: incoming.age_months ?? existing.age_months,
    wake_time: incoming.wake_time ?? existing.wake_time,
    bedtime: incoming.bedtime ?? existing.bedtime,
    naps_count: incoming.naps_count ?? existing.naps_count,
    nap_lengths: incoming.nap_lengths ?? existing.nap_lengths,
    main_issue: incoming.main_issue ?? existing.main_issue,
    confidence_score: Math.max(incoming.confidence_score, existing.confidence_score),
    assumptions: [...new Set([...existing.assumptions, ...incoming.assumptions])],
  }
}

export async function extractWithGemini(text: string): Promise<ExtractedFields> {
  const model = getFlashModel()
  const prompt = `Extract baby sleep information from the text below. Return ONLY valid JSON with no other text or markdown.

${sanitizeForPrompt(text, 1000)}

Return this exact JSON structure (use null for unknown fields, times in HH:MM 24h format):
{
  "age_months": <number or null>,
  "wake_time": <"HH:MM" or null>,
  "bedtime": <"HH:MM" or null>,
  "naps_count": <number or null>,
  "nap_lengths": <"X-Y min" string or null>,
  "main_issue": <string or null>
}`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text().trim()

    // Strip markdown code fences if present
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    const fields: ExtractedFields = {
      age_months: typeof parsed.age_months === 'number' ? Math.floor(parsed.age_months) : null,
      wake_time: typeof parsed.wake_time === 'string' ? parsed.wake_time : null,
      bedtime: typeof parsed.bedtime === 'string' ? parsed.bedtime : null,
      naps_count: typeof parsed.naps_count === 'number' ? parsed.naps_count : null,
      nap_lengths: typeof parsed.nap_lengths === 'string' ? parsed.nap_lengths : null,
      main_issue: typeof parsed.main_issue === 'string' ? parsed.main_issue : null,
      confidence_score: 0,
      assumptions: [],
    }

    // Recalculate confidence
    let score = 0
    if (fields.age_months !== null) score += 0.5
    if (fields.wake_time !== null) score += 0.25
    if (fields.bedtime !== null) score += 0.1
    if (fields.naps_count !== null) score += 0.1
    if (fields.main_issue !== null) score += 0.05
    fields.confidence_score = score

    return fields
  } catch {
    // Return empty fields if extraction fails — caller will ask follow-up questions
    return {
      age_months: null,
      wake_time: null,
      bedtime: null,
      naps_count: null,
      nap_lengths: null,
      main_issue: null,
      confidence_score: 0,
      assumptions: [],
    }
  }
}
