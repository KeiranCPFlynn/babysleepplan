import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { getFlashModel, getModel } from '@/lib/gemini'
import {
  freeSchedulePreviewLimiter,
  getClientIp,
  hashValue,
} from '@/lib/rate-limit'
import {
  extractFieldsFromText,
  extractWithGemini,
  mergeFields,
} from '@/lib/free-schedule/extractor'
import { loadFreeKnowledgeBase } from '@/lib/free-schedule/knowledge-loader'
import type { ChatMessage, ExtractedFields } from '@/lib/free-schedule/types'

export const runtime = 'nodejs'
export const maxDuration = 60

type OutputMode = 'standard' | 'admin_social'

const FOLLOW_UP_QUESTIONS = [
  {
    missing: 'age_months' as const,
    question: "How old is your baby?",
    quickReplies: [
      'Newborn (0–3m)',
      '4–6 months',
      '6–9 months',
      '9–12 months',
      '12–18 months',
      '18–24 months',
      '2+ years',
    ],
  },
  {
    missing: 'wake_time' as const,
    question: "What time do they usually wake up in the morning?",
    quickReplies: [
      'Before 6am',
      '6:00–6:30am',
      '6:30–7:00am',
      '7:00–7:30am',
      'After 7:30am',
    ],
  },
  {
    missing: 'main_issue' as const,
    question: "What's the main sleep challenge you're trying to improve?",
    quickReplies: [
      'Night wakings',
      'Hard to settle at bedtime',
      'Short naps',
      'Early morning waking',
      'Just need a schedule',
    ],
  },
]

// Parse chip selections like "4–6 months" into structured values
function parseChipAnswer(chip: string): Partial<ExtractedFields> {
  const lower = chip.toLowerCase()

  // Age chips
  if (lower.includes('newborn') || lower.includes('0–3') || lower.includes('0-3')) {
    return { age_months: 1 }
  }
  if (lower.includes('4–6') || lower.includes('4-6')) return { age_months: 5 }
  if (lower.includes('6–9') || lower.includes('6-9')) return { age_months: 7 }
  if (lower.includes('9–12') || lower.includes('9-12')) return { age_months: 10 }
  if (lower.includes('12–18') || lower.includes('12-18')) return { age_months: 15 }
  if (lower.includes('18–24') || lower.includes('18-24')) return { age_months: 21 }
  if (lower.includes('2+') || lower.includes('2 year') || lower.includes('2yr')) {
    return { age_months: 30 }
  }

  // Wake time chips
  if (lower.includes('before 6')) return { wake_time: '05:30' }
  if (lower.includes('6:00–6:30') || lower.includes('6:00-6:30')) return { wake_time: '06:15' }
  if (lower.includes('6:30–7:00') || lower.includes('6:30-7:00')) return { wake_time: '06:45' }
  if (lower.includes('7:00–7:30') || lower.includes('7:00-7:30')) return { wake_time: '07:15' }
  if (lower.includes('after 7:30')) return { wake_time: '07:45' }

  // Main issue chips and free-text variations
  if (lower.includes('night waking') || lower.includes('night wak')) {
    return { main_issue: 'frequent night wakings' }
  }
  if (lower.includes('hard to settle') || lower.includes('bedtime battle') || lower.includes('settle')) {
    return { main_issue: 'hard to settle at bedtime' }
  }
  if (
    lower.includes('short nap') ||
    lower.includes('longer nap') ||
    lower.includes('nap') // any nap-related free text defaults to short naps
  ) {
    return { main_issue: 'short naps' }
  }
  if (lower.includes('early morning') || lower.includes('early wak')) {
    return { main_issue: 'early morning waking' }
  }
  if (lower.includes('just need a schedule')) return { main_issue: null }

  return {}
}

// A sleep word is required — child words alone (e.g. "baby drinks beer") are not sufficient.
const SLEEP_WORDS = [
  'sleep', 'nap', 'bedtime', 'wake', 'wak', 'night', 'tired',
  'overtired', 'schedule', 'routine', 'feed', 'milk', 'bottle', 'breast',
  'swaddle', 'settl', 'cry', 'fuss', 'pacif', 'dummy',
]
const CHILD_WORDS = ['baby', 'infant', 'newborn', 'toddler', 'child', 'kid']

// Phrases that explicitly indicate the message is not a genuine sleep question.
// Checked before keyword matching so they override sleep-adjacent words.
const DISQUALIFIERS = [
  "don't have a baby", "dont have a baby", "i have no baby",
  "don't have a child", "dont have a child",
  "just testing", "just kidding", "just joking", "just a test",
  "not real", "i made it up", "fake",
  "nevermind", "never mind", "ignore this",
]

function hasDisqualifier(text: string): boolean {
  const lower = text.toLowerCase()
  return DISQUALIFIERS.some((d) => lower.includes(d))
}

function isOnTopic(text: string): boolean {
  if (hasDisqualifier(text)) return false
  const lower = text.toLowerCase()
  const hasSleepWord = SLEEP_WORDS.some((kw) => lower.includes(kw))
  // Child word alone only qualifies if the message is substantial enough to suggest real context
  const hasChildContext = CHILD_WORDS.some((kw) => lower.includes(kw)) && lower.length > 60
  return hasSleepWord || hasChildContext
}

// Lightweight semantic check — only called when keyword extraction gives confidence < 0.15.
// Uses Gemini Flash for a single YES/NO token. Fails open so a Flash error never blocks real users.
async function isGenuineSleepQuestion(text: string): Promise<boolean> {
  try {
    const model = getFlashModel()
    const result = await model.generateContent(
      `Is the following message a genuine request for help with a real baby or toddler's sleep schedule?\n` +
      `Reply with only YES or NO.\n\nMessage: "${text.slice(0, 300)}"`
    )
    return result.response.text().trim().toUpperCase().startsWith('YES')
  } catch {
    return true // fail open — classifier failure must never block a real user
  }
}

function buildStandardSchedulePrompt(
  fields: ExtractedFields,
  knowledgeContent: string,
  originalDescription: string
): string {
  const ageLabel =
    fields.age_months !== null
      ? `${fields.age_months} month${fields.age_months !== 1 ? 's' : ''}`
      : 'unknown age'

  const formatTime = (t: string | null) => {
    if (!t) return 'not specified'
    const [h, m] = t.split(':').map(Number)
    const suffix = h >= 12 ? 'pm' : 'am'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayH}:${String(m).padStart(2, '0')}${suffix}`
  }

  const assumptionLines =
    fields.assumptions.length > 0
      ? fields.assumptions.map((a) => `- ${a}`).join('\n')
      : 'None — all values provided directly.'

  return `You are a friendly, evidence-based paediatric sleep consultant creating a concise, practical sleep schedule.

## Knowledge Base
${knowledgeContent}

## What the Parent Described
"${originalDescription}"

Use this to inform the tone and specific references in Key Guidance. Reference the parent's actual situation naturally — don't just list generic tips.

## Baby Information
- Age: ${ageLabel}
- Usual morning wake time: ${formatTime(fields.wake_time)}
- Current bedtime: ${formatTime(fields.bedtime)}
- Naps per day: ${fields.naps_count !== null ? fields.naps_count : 'not specified'}
- Typical nap length: ${fields.nap_lengths || 'not specified'}
- Main sleep challenge: ${fields.main_issue || 'general schedule optimisation'}

## Assumptions Made
${assumptionLines}

---

## Instructions

Create a RECOMMENDED ideal schedule — not a mirror of the parent's current (likely broken) routine. Times mentioned by the parent may be night wakings or current problem patterns, not the intended schedule.

Anchor the schedule on the provided morning wake time if it looks like a realistic daytime start (before 10am). If none was provided, or if it looks like a night waking, default to 7:00 AM. Build all nap and bedtime times forward from there using age-appropriate wake windows from the knowledge base.

Output MUST follow this exact structure with these exact heading names:

## Your Daily Schedule

| Time | Activity |
|------|----------|
[Insert 4–6 rows: wake time, nap(s) with target durations, bedtime, one brief night note if relevant]

## Key Guidance

[5–7 bullet points. Each bullet is 1–2 sentences. Every bullet must be directly relevant to the parent's described situation — reference their specific challenge, their baby's age, and any details they mentioned. No generic filler. This section should read as expert advice written specifically for this family, not a template.]

## If/Then Adjustments

[2–3 blocks in this exact format:]
**If [specific situation]:** [one-sentence action]

## Assumptions

Based on what you shared, this schedule assumes: [one sentence listing any values inferred or assumed].

## Next Steps

[One sentence naming the parent's specific challenge ("${fields.main_issue || 'getting consistent sleep'}") and explaining concretely what a full LunaCradle plan adds: a step-by-step method to make the changes gradual, weekly schedule updates as the baby grows, and a daily diary to track what's working. Do not use the word "personalised". Show specificity — make it clear this goes well beyond a schedule.]

---

Rules:
- Do NOT use emojis
- Keep total output under 900 words
- Use exact times (e.g. "7:00 AM", not "morning")
- Reference the baby's age naturally (e.g. "at ${ageLabel}")
- For temperature advice, treat 16–20°C (61–68°F) as a flexible benchmark, not a strict universal requirement, and acknowledge that many families cannot maintain that range
- Always include fallback guidance focused on preventing overheating (breathable layers, lower TOG, airflow/ventilation, shade, coolest safely achievable room temperature)
- If the parent mentions illness, fever, or developmental concerns, add one sentence in Key Guidance acknowledging this is outside the scope of a schedule and they should speak to their paediatrician — then continue normally
- Do not add any text outside the five sections above`
}

function buildAdminSocialPrompt(
  fields: ExtractedFields,
  knowledgeContent: string,
  originalDescription: string
): string {
  const ageLabel =
    fields.age_months !== null
      ? `${fields.age_months} month${fields.age_months !== 1 ? 's' : ''}`
      : 'unknown age'

  const formatTime = (t: string | null) => {
    if (!t) return 'not specified'
    const [h, m] = t.split(':').map(Number)
    const suffix = h >= 12 ? 'pm' : 'am'
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayH}:${String(m).padStart(2, '0')}${suffix}`
  }

  const assumptionLines =
    fields.assumptions.length > 0
      ? fields.assumptions.map((a) => `- ${a}`).join('\n')
      : '- None — all values provided directly.'

  return `You are writing a concise social-media-ready reply for a parent asking for baby/toddler sleep help.
Use a calm, human, confident tone. Avoid consultant jargon and avoid hedging words like "might", "possibly", "maybe".

## Knowledge Base
${knowledgeContent}

## What the Parent Described
"${originalDescription}"

## Baby Information
- Age: ${ageLabel}
- Usual morning wake time: ${formatTime(fields.wake_time)}
- Current bedtime: ${formatTime(fields.bedtime)}
- Naps per day: ${fields.naps_count !== null ? fields.naps_count : 'not specified'}
- Typical nap length: ${fields.nap_lengths || 'not specified'}
- Main sleep challenge: ${fields.main_issue || 'general schedule optimisation'}

## Assumptions Made
${assumptionLines}

Output MUST use exactly these five headings:

## Your Daily Schedule
[First line: one tailored context sentence referencing their exact situation.]
[Then plain label lines only, no table:]
Wake: [time]
Nap 1: [time range + duration] OR Quiet Time: [time + explicitly "no sleep"]
Nap 2: [time range + duration] if age-appropriate
Routine: [time]
Lights Out: [time]

## Key Guidance
### Why this works
[Exactly 2 bullets. Keep short and practical.]
### What to Track for 3 Days
[Exactly 4 bullets with these metrics: lights out time, asleep time, night waking count, morning wake time.]

## If/Then Adjustments
[At least 2 and at most 3 blocks in this exact style:]
If [specific scenario]:
- [single concrete action]

## Assumptions
Confidence: [High/Medium/Low] ([one short assumptions sentence]).

## Next Steps
[One gentle close sentence offering a more detailed adaptive plan; no links.]

Hard rules:
- No markdown tables
- Keep total output under 250 words
- Chronological order only in "Your Daily Schedule"
- Do not duplicate labels or time rows
- Wake appears once only
- If nap is removed, do not reinsert it elsewhere
- Bedtime/lights out must be after the final daytime activity
- Mention the age-appropriate total sleep range once
- Mention sleep pressure or circadian rhythm once
- Use no more than 6 bullets in "Key Guidance"
- No emojis

Before finalizing, run this internal validate_schedule checklist:
1) chronological schedule
2) no repeated labels
3) no repeated times
4) wake appears once
5) bedtime/lights out after last daytime activity
If any check fails, rewrite before returning.

Return only the five sections above.`
}

function parseTimeToMinutes(text: string): number | null {
  const match = text.toLowerCase().match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2] ?? '0', 10)
  const meridian = match[3]

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null
  if (hours === 12) hours = 0
  if (meridian === 'pm') hours += 12

  return hours * 60 + minutes
}

function getSectionBody(markdown: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i')
  const match = markdown.match(regex)
  return match?.[1]?.trim() ?? ''
}

function validateSchedule(markdown: string): string[] {
  const issues: string[] = []
  const section = getSectionBody(markdown, 'Your Daily Schedule')

  if (!section) {
    return ['Missing "Your Daily Schedule" section content.']
  }

  const labelRegex = /^\s*([A-Za-z][A-Za-z0-9 /-]{1,30}):\s*(.+)\s*$/
  const lines = section.split('\n').map((line) => line.trim()).filter(Boolean)
  const labels = new Set<string>()
  const times = new Set<number>()
  const orderedTimes: number[] = []
  let wakeCount = 0
  let lightsOutTime: number | null = null

  for (const line of lines) {
    const match = line.match(labelRegex)
    if (!match) continue

    const label = match[1].toLowerCase().replace(/\s+/g, ' ').trim()
    const value = match[2]

    if (labels.has(label)) {
      issues.push(`Duplicate schedule label: "${match[1]}".`)
    }
    labels.add(label)

    if (label === 'wake') {
      wakeCount += 1
    }

    const timeValue = parseTimeToMinutes(value)
    if (timeValue !== null) {
      if (times.has(timeValue)) {
        issues.push(`Repeated time in schedule: "${value}".`)
      }
      times.add(timeValue)
      orderedTimes.push(timeValue)

      if (label === 'lights out' || label === 'bedtime') {
        lightsOutTime = timeValue
      }
    }
  }

  if (labels.size < 3) {
    issues.push('Schedule contains too few labeled rows.')
  }

  if (wakeCount !== 1) {
    issues.push('Wake must appear exactly once.')
  }

  for (let i = 1; i < orderedTimes.length; i += 1) {
    if (orderedTimes[i] <= orderedTimes[i - 1]) {
      issues.push('Schedule times are not in chronological order.')
      break
    }
  }

  if (lightsOutTime === null) {
    issues.push('Missing "Lights Out" (or bedtime) entry.')
  } else if (orderedTimes.length > 1) {
    const latestNonBedtime = Math.max(
      ...orderedTimes.filter((t) => t !== lightsOutTime)
    )
    if (lightsOutTime <= latestNonBedtime) {
      issues.push('Lights Out must be after the last daytime activity.')
    }
  }

  return issues
}

function buildAdminRepairPrompt(draft: string, issues: string[]): string {
  return `The draft below failed schedule validation.
Fix all issues and return a corrected version using the exact same five headings and constraints.

Validation issues:
${issues.map((issue) => `- ${issue}`).join('\n')}

Draft:
${draft}`
}

async function generateWithTimeout(
  model: ReturnType<typeof getFlashModel>,
  prompt: string,
  timeoutMs: number
) {
  let timeoutId: NodeJS.Timeout | null = null
  try {
    return await Promise.race([
      model.generateContent(prompt),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Model generation timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export async function POST(request: NextRequest) {
  // Kill switch — set FREE_SCHEDULE_ENABLED=false to turn off the whole tool instantly
  if (process.env.FREE_SCHEDULE_ENABLED === 'false') {
    return NextResponse.json(
      { status: 'error', error: 'The free schedule builder is temporarily unavailable.' },
      { status: 503 }
    )
  }

  const isDev = process.env.NODE_ENV === 'development'

  const ip = getClientIp(request)
  const ipHash = hashValue(ip)

  if (!isDev) {
    // In-memory per-IP soft limit (best-effort on serverless, stops casual repeat clicks)
    const rateCheck = freeSchedulePreviewLimiter.check(ipHash)
    if (rateCheck.limited) {
      return NextResponse.json(
        {
          status: 'rate_limited',
          message: 'Too many requests from this location. Please try again tomorrow.',
          retryAfterMs: rateCheck.retryAfterMs,
        },
        { status: 429 }
      )
    }
  }

  // Global daily cap (DB-backed — survives deploys and multiple serverless instances)
  // Protects Gemini API costs. Default: 100 generations/day. Override via env var.
  const dailyGenerateLimit = parseInt(process.env.FREE_SCHEDULE_MAX_DAILY_GENERATES ?? '100', 10)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (!isDev) {
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const { count: todayCount } = await supabaseAdmin
      .from('free_schedule_sessions')
      .select('id', { count: 'exact', head: true })
      .gte('report_generated_at', todayStart.toISOString())

    if ((todayCount ?? 0) >= dailyGenerateLimit) {
      return NextResponse.json(
        {
          status: 'rate_limited',
          message: 'The free schedule builder is very busy today. Please try again tomorrow.',
        },
        { status: 429 }
      )
    }
  }

  let body: {
    messages?: ChatMessage[]
    sessionId?: string
    extractedFields?: ExtractedFields
    questionsAsked?: number
    turnstileToken?: string
    outputMode?: OutputMode
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', error: 'Invalid request body' }, { status: 400 })
  }

  const { messages, sessionId: existingSessionId, extractedFields: clientFields } = body
  const questionsAsked = body.questionsAsked ?? 0
  const outputMode: OutputMode =
    body.outputMode === 'admin_social' && isDev ? 'admin_social' : 'standard'
  const isAdminSocialMode = outputMode === 'admin_social'

  // Turnstile verification on first message only (questionsAsked === 0)
  // Skipped in local dev when TURNSTILE_SECRET_KEY is not set
  if (questionsAsked === 0) {
    const siteSecret = process.env.TURNSTILE_SECRET_KEY
    if (siteSecret) {
      if (!body.turnstileToken) {
        return NextResponse.json(
          { status: 'error', error: 'Bot verification required.' },
          { status: 400 }
        )
      }
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: siteSecret, response: body.turnstileToken }),
        }
      )
      const { success } = (await verifyRes.json()) as { success: boolean }
      if (!success) {
        return NextResponse.json(
          { status: 'error', error: 'Bot verification failed. Please refresh and try again.' },
          { status: 400 }
        )
      }
    }
  }

  if (!messages?.length) {
    return NextResponse.json({ status: 'error', error: 'No messages provided' }, { status: 400 })
  }

  // Combine all user messages into one text blob for extraction
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')

  const sessionId = existingSessionId || randomUUID()

  // Step 1: Heuristic extraction on current user text
  let fields = extractFieldsFromText(userText)

  // Step 2: Merge with previously extracted fields from client
  if (clientFields) {
    fields = mergeFields(clientFields, fields)
  }

  // Step 3: Also try parsing the latest user message as a chip answer
  const latestUserMessage = messages.filter((m) => m.role === 'user').pop()
  if (latestUserMessage) {
    const chipResult = parseChipAnswer(latestUserMessage.content)
    if (Object.keys(chipResult).length > 0) {
      fields = mergeFields(fields, {
        ...fields,
        ...chipResult,
      } as ExtractedFields)
    }
  }

  // Step 4: Gemini fallback if age is still unknown and confidence is low
  if (fields.age_months === null && fields.confidence_score < 0.3) {
    fields = mergeFields(clientFields || fields, await extractWithGemini(userText))
  }

  // Step 4b: Off-topic guard
  // Fast path: keyword check (zero cost)
  if (!isAdminSocialMode && questionsAsked === 0 && !isOnTopic(userText)) {
    return NextResponse.json({
      status: 'needs_info',
      sessionId,
      extractedFields: fields,
      followUpQuestion:
        "I'm set up specifically to help with baby and toddler sleep schedules. " +
        "Tell me about your little one's sleep — their age and what's been happening — " +
        "and I'll put together a free schedule for you.",
      quickReplies: [],
      questionsAsked: 0,
    })
  }
  // Semantic fallback: if extraction gave us nothing meaningful (confidence < 0.15),
  // ask Gemini Flash to confirm it's a genuine sleep question before asking follow-ups.
  // Catches absurd inputs that happen to contain sleep words ("my cat never sleeps").
  if (!isAdminSocialMode && questionsAsked === 0 && fields.confidence_score < 0.15) {
    const genuine = await isGenuineSleepQuestion(userText)
    if (!genuine) {
      return NextResponse.json({
        status: 'needs_info',
        sessionId,
        extractedFields: fields,
        followUpQuestion:
          "I'm set up specifically to help with baby and toddler sleep schedules. " +
          "Tell me about your little one's sleep — their age and what's been happening — " +
          "and I'll put together a free schedule for you.",
        quickReplies: [],
        questionsAsked: 0,
      })
    }
  }

  // Step 5: Determine if we need a follow-up question
  if (!isAdminSocialMode && fields.age_months === null && questionsAsked < 3) {
    const q = FOLLOW_UP_QUESTIONS[0]
    return NextResponse.json({
      status: 'needs_info',
      sessionId,
      extractedFields: fields,
      followUpQuestion: q.question,
      quickReplies: q.quickReplies,
      questionsAsked: questionsAsked + 1,
    })
  }

  if (!isAdminSocialMode && fields.wake_time === null && questionsAsked < 3) {
    const q = FOLLOW_UP_QUESTIONS[1]
    return NextResponse.json({
      status: 'needs_info',
      sessionId,
      extractedFields: fields,
      followUpQuestion: q.question,
      quickReplies: q.quickReplies,
      questionsAsked: questionsAsked + 1,
    })
  }

  // Optional 3rd question: main_issue (only if no other questions have been asked yet)
  // Using < 1 prevents re-asking when the user gives a free-text answer we couldn't parse
  if (!isAdminSocialMode && fields.main_issue === null && questionsAsked < 1) {
    const q = FOLLOW_UP_QUESTIONS[2]
    return NextResponse.json({
      status: 'needs_info',
      sessionId,
      extractedFields: fields,
      followUpQuestion: q.question,
      quickReplies: q.quickReplies,
      questionsAsked: questionsAsked + 1,
    })
  }

  // Step 5b: Chip-bypass guard — if the first organic message had no sleep content and the user
  // just clicked through chips, refuse to generate rather than produce a nonsense schedule.
  const firstUserMessage = messages.find((m) => m.role === 'user')?.content ?? ''
  if (!isAdminSocialMode && questionsAsked > 0 && !isOnTopic(firstUserMessage)) {
    return NextResponse.json({
      status: 'needs_info',
      sessionId,
      extractedFields: fields,
      followUpQuestion:
        "I need a bit more context before I can put together a schedule. " +
        "Can you describe what's been going on with your baby's sleep? " +
        "For example, when do they wake up, how many naps, and what the main challenge is.",
      quickReplies: [],
      questionsAsked: 0,
    })
  }

  // Step 6: Age still unknown after all questions — terminal error
  if (!isAdminSocialMode && fields.age_months === null) {
    return NextResponse.json(
      { status: 'error', error: "I need your baby's age to create a schedule. How old are they in months?" },
      { status: 400 }
    )
  }

  if (isAdminSocialMode && fields.age_months === null) {
    fields.age_months = 12
    fields.assumptions.push('Age assumed to be 12 months (not clearly stated in source post)')
  }

  // Step 7: Assume wake_time if still missing
  if (fields.wake_time === null) {
    fields.wake_time = '07:00'
    fields.assumptions.push("Wake time assumed to be 7:00 AM (not provided)")
  }

  // Final type/runtime guard so generation always has a concrete age.
  if (fields.age_months === null) {
    fields.age_months = 12
    fields.assumptions.push('Age assumed to be 12 months (not clearly stated in source post)')
  }

  const resolvedAgeMonths = fields.age_months

  // Step 8: Load knowledge base and generate schedule
  const { content: knowledgeContent } = loadFreeKnowledgeBase(
    resolvedAgeMonths,
    fields.main_issue
  )

  const originalDescription = messages.find((m) => m.role === 'user')?.content?.slice(0, 400) ?? ''
  const prompt =
    outputMode === 'admin_social'
      ? buildAdminSocialPrompt(fields, knowledgeContent, originalDescription)
      : buildStandardSchedulePrompt(fields, knowledgeContent, originalDescription)

  let scheduleMarkdown: string
  try {
    const primaryModel = isAdminSocialMode ? getModel() : getFlashModel()
    let result
    let usedFallback = false

    try {
      result = await generateWithTimeout(
        primaryModel,
        prompt,
        isAdminSocialMode ? 30000 : 20000
      )
    } catch (primaryErr) {
      if (!isAdminSocialMode) {
        throw primaryErr
      }
      // Social mode prefers Pro, but should still return quickly if Pro is slow/unavailable.
      result = await generateWithTimeout(getFlashModel(), prompt, 20000)
      usedFallback = true
    }

    scheduleMarkdown = result.response.text()

    if (outputMode === 'admin_social') {
      const issues = validateSchedule(scheduleMarkdown)
      if (issues.length > 0 && !usedFallback) {
        const repairResult = await generateWithTimeout(
          getFlashModel(),
          buildAdminRepairPrompt(scheduleMarkdown, issues),
          12000
        )
        const repairedMarkdown = repairResult.response.text()
        const repairIssues = validateSchedule(repairedMarkdown)
        if (repairIssues.length === 0) {
          scheduleMarkdown = repairedMarkdown
        }
      }
    }
  } catch (err) {
    console.error('Gemini schedule generation failed:', err)
    return NextResponse.json(
      { status: 'error', error: 'Failed to generate schedule. Please try again.' },
      { status: 500 }
    )
  }

  // Step 9: Persist to DB
  try {
    await supabaseAdmin.from('free_schedule_sessions').upsert(
      {
        session_id: sessionId,
        extracted_fields: fields,
        report_content: scheduleMarkdown,
        report_generated_at: new Date().toISOString(),
        ip_hash: ipHash,
      },
      { onConflict: 'session_id' }
    )
  } catch (err) {
    // Non-fatal: log but don't block the response
    console.error('Failed to persist free schedule session:', err)
  }

  const ageLabelShort =
    fields.age_months !== null ? `${fields.age_months}-month-old` : 'little one'
  const issueClause = fields.main_issue ? ` and their ${fields.main_issue}` : ''
  const introMessage =
    `Based on what you've shared about your ${ageLabelShort}${issueClause}, ` +
    `here's a schedule with guidance tailored to your situation.`

  return NextResponse.json({
    status: 'complete',
    sessionId,
    extractedFields: fields,
    scheduleMarkdown,
    introMessage,
  })
}
