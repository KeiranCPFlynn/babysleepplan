import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getModel } from '@/lib/gemini'
import { sendPlanReadyEmail } from '@/lib/email/send'
import fs from 'fs'
import path from 'path'

// Use service role for API (triggered by webhook)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Smart knowledge base loader - only loads relevant files
interface KnowledgeContext {
  ageMonths: number
  problems: string[] | null
  cryingComfortLevel: number | null
}

function loadKnowledgeBase(context: KnowledgeContext): string {
  const knowledgeDir = path.join(process.cwd(), 'src/data/knowledge')
  const filesToLoad: string[] = []

  // Always load core files
  filesToLoad.push('core-principles.txt', 'red-flags.txt', 'bedtime-routines.txt', 'sleep-environment.txt')

  // Load age-appropriate file based on baby's age
  const { ageMonths } = context
  if (ageMonths < 4) {
    filesToLoad.push('age-0-3-months.txt')
  } else if (ageMonths < 6) {
    filesToLoad.push('age-4-6-months.txt')
  } else if (ageMonths < 9) {
    filesToLoad.push('age-6-9-months.txt')
  } else if (ageMonths < 12) {
    filesToLoad.push('age-9-12-months.txt')
  } else if (ageMonths < 18) {
    filesToLoad.push('age-12-18-months.txt')
  } else {
    filesToLoad.push('age-18-24-months.txt')
  }

  // Load problem-specific files based on selected problems
  const problemFileMap: Record<string, string> = {
    'hard_to_settle': 'problems-bedtime-resistance.txt',
    'frequent_wakings': 'problems-night-wakings.txt',
    'early_waking': 'problems-early-waking.txt',
    'short_naps': 'problems-short-naps.txt',
    'nap_resistance': 'problems-short-naps.txt',
    'sleep_associations': 'problems-falling-asleep.txt',
    'night_feeds': 'night-weaning.txt',
    'schedule': 'nap-transitions.txt',
    'transitions': 'nap-transitions.txt',
    'separation_anxiety': 'problems-bedtime-resistance.txt',
  }

  if (context.problems && context.problems.length > 0) {
    for (const problem of context.problems) {
      const file = problemFileMap[problem]
      if (file && !filesToLoad.includes(file)) {
        filesToLoad.push(file)
      }
    }
  }

  // Load method file based on crying comfort level (1-5)
  const cryingLevel = context.cryingComfortLevel ?? 3
  if (cryingLevel <= 2) {
    filesToLoad.push('methods-gentle.txt')
  } else if (cryingLevel <= 3) {
    filesToLoad.push('methods-gradual.txt')
  } else {
    filesToLoad.push('methods-direct.txt')
  }

  // Load regressions info (commonly relevant)
  filesToLoad.push('regressions.txt')

  // Load parent factors
  filesToLoad.push('parent-factors.txt')

  // Remove duplicates
  const uniqueFiles = [...new Set(filesToLoad)]

  // Load the selected files
  let knowledge = ''
  let loadedCount = 0

  for (const file of uniqueFiles) {
    try {
      const filePath = path.join(knowledgeDir, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        knowledge += `\n\n--- ${file} ---\n${content}`
        loadedCount++
      } else {
        console.warn(`Knowledge file not found: ${file}`)
      }
    } catch (error) {
      console.error(`Failed to load ${file}:`, error)
    }
  }

  console.log(`Loaded ${loadedCount} relevant knowledge files: ${uniqueFiles.join(', ')}`)
  console.log(`Knowledge base size: ${knowledge.length.toLocaleString()} characters`)

  if (loadedCount === 0) {
    throw new Error('Failed to load any knowledge files')
  }

  return knowledge
}

// Calculate baby's age
function calculateAge(dob: string, prematureWeeks: number = 0): { months: number; weeks: number; adjustedMonths: number } {
  const birth = new Date(dob)
  const now = new Date()
  const diffTime = now.getTime() - birth.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffDays / 7)
  const months = Math.floor(diffDays / 30.44)

  // Adjusted age for premature babies (subtract premature weeks)
  const adjustedDays = diffDays - (prematureWeeks * 7)
  const adjustedMonths = Math.max(0, Math.floor(adjustedDays / 30.44))

  return { months, weeks, adjustedMonths }
}

const OTHER_PREFIX = 'other:'

function extractCustomValue(value: string | null) {
  if (!value) return null
  if (value === 'other') return 'Other'
  if (value.startsWith(OTHER_PREFIX)) {
    const custom = value.slice(OTHER_PREFIX.length).trim()
    return custom || 'Other'
  }
  return null
}

// Map database values to readable text
function formatMethod(value: string | null): string {
  const custom = extractCustomValue(value)
  if (custom) return custom === 'Other' ? 'Other method' : custom
  const methods: Record<string, string> = {
    nursing: 'Nursing/Bottle feeding',
    rocking: 'Rocking',
    holding: 'Being held',
    patting: 'Patting/Shushing',
    cosleeping: 'Co-sleeping',
    independent: 'Falls asleep independently',
    stroller: 'Stroller/Car',
    other: 'Other method',
  }
  return methods[value || ''] || value || 'Not specified'
}

function formatDuration(value: string | null): string {
  const custom = extractCustomValue(value)
  if (custom) return custom === 'Other' ? 'Other duration' : custom
  const durations: Record<string, string> = {
    under_5: 'Under 5 minutes (quick resettle)',
    '5_10': '5-10 minutes',
    '10_15': '10-15 minutes',
    '15_30': '15-30 minutes',
    '30_45': '30-45 minutes',
    '45_60': '45-60 minutes',
    '60_90': '1-1.5 hours',
    over_90: 'Over 1.5 hours',
    under_15: 'Under 15 minutes',
    '30_60': '30-60 minutes',
    over_60: 'Over 1 hour',
    under_30: 'Under 30 minutes (cat naps)',
    '90_120': '1.5-2 hours',
    over_120: 'Over 2 hours',
    varies: 'Varies widely',
  }
  return durations[value || ''] || value || 'Not specified'
}

function formatLocation(value: string | null): string {
  const custom = extractCustomValue(value)
  if (custom) return custom === 'Other' ? 'Other location' : custom
  const locations: Record<string, string> = {
    crib: 'Crib/Bassinet',
    parent_bed: "Parent's bed",
    swing: 'Swing/Bouncer',
    carrier: 'Baby carrier/Wrap',
    stroller: 'Stroller',
    car: 'Car seat',
    arms: 'In arms',
    multiple: 'Multiple locations',
  }
  return locations[value || ''] || value || 'Not specified'
}

function formatProblems(problems: string[] | null): string {
  if (!problems || problems.length === 0) return 'None specified'

  const problemLabels: Record<string, string> = {
    hard_to_settle: 'Hard to settle at bedtime',
    frequent_wakings: 'Frequent night wakings',
    early_waking: 'Waking too early in the morning',
    short_naps: 'Short naps',
    nap_resistance: 'Resists napping',
    sleep_associations: 'Needs specific conditions to sleep',
    night_feeds: 'Still needs night feeds',
    schedule: 'Inconsistent schedule',
    transitions: 'Difficulty with sleep cycle transitions',
    separation_anxiety: 'Separation anxiety at sleep times',
  }

  return problems.map(p => problemLabels[p] || p).join(', ')
}

type AdditionalSleepTime = {
  bedtime?: string
  waketime?: string
}

function getAdditionalSleepTimes(data: unknown): AdditionalSleepTime[] {
  if (!data || typeof data !== 'object') return []
  const raw = (data as Record<string, unknown>).additional_sleep_times
  if (!Array.isArray(raw)) return []
  return raw.filter((item) => item && typeof item === 'object') as AdditionalSleepTime[]
}

function formatAdditionalSleepTimes(times: AdditionalSleepTime[]) {
  if (times.length === 0) return 'None'
  return times
    .map((time, index) => {
      const bedtime = time.bedtime || 'Not specified'
      const waketime = time.waketime || 'Not specified'
      return `  - Period ${index + 2}: Bedtime ${bedtime}, Wake ${waketime}`
    })
    .join('\n')
}

function formatTemperament(value: string | null): string {
  const labels: Record<string, string> = {
    easy: 'Easy-going',
    moderate: 'Moderate / average',
    adaptable: 'Adaptable / flexible',
    sensitive: 'Sensitive / easily overstimulated',
    slow_to_warm: 'Slow to warm up / cautious',
    persistent: 'Persistent / determined',
    spirited: 'Spirited / high needs',
    not_sure: 'Not sure yet',
    other: 'Other',
  }
  return labels[value || ''] || value || 'Not specified'
}

function formatCryingLevel(level: number | null): string {
  const levels: Record<number, string> = {
    1: 'No crying - wants a completely no-cry approach',
    2: 'Minimal crying - a few minutes of fussing is okay',
    3: 'Some crying - short periods of crying are acceptable',
    4: 'Moderate crying - can handle timed check-ins with crying',
    5: 'Any method - open to any approach that works',
  }
  return levels[level || 3] || 'Moderate (some crying acceptable)'
}

export async function POST(request: NextRequest) {
  let planId: string | undefined

  try {
    // Verify API key or internal call
    const authHeader = request.headers.get('authorization')
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-generate-plan'

    if (authHeader !== `Bearer ${internalKey}`) {
      // Allow calls without auth for now (webhook will call this)
      console.log('Generate plan called without auth - allowing for now')
    }

    const body = await request.json()
    planId = body.planId

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    console.log('Starting plan generation for:', planId)

    const supabase = getSupabaseAdmin()

    // Get plan first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('Failed to fetch plan:', planError)
      return NextResponse.json({ error: 'Plan not found', details: planError.message }, { status: 404 })
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    console.log('Fetched plan:', { id: plan.id, status: plan.status, baby_id: plan.baby_id, intake_submission_id: plan.intake_submission_id })

    // Fetch baby and intake separately to avoid join issues
    const { data: baby, error: babyError } = await supabase
      .from('babies')
      .select('*')
      .eq('id', plan.baby_id)
      .single()

    if (babyError) {
      console.error('Failed to fetch baby:', babyError)
    }

    const { data: intake, error: intakeError } = await supabase
      .from('intake_submissions')
      .select('*')
      .eq('id', plan.intake_submission_id)
      .single()

    if (intakeError) {
      console.error('Failed to fetch intake:', intakeError)
    }

    console.log('Fetched related data:', { hasBaby: !!baby, hasIntake: !!intake })

    // Allow retry if failed, skip if already completed
    if (plan.status === 'completed') {
      return NextResponse.json({ error: 'Plan already generated' }, { status: 400 })
    }

    // If failed, reset to generating
    if (plan.status === 'failed') {
      await supabase
        .from('plans')
        .update({ status: 'generating', error_message: null })
        .eq('id', planId)
    }

    if (!baby || !intake) {
      await supabase
        .from('plans')
        .update({ status: 'failed', error_message: 'Missing baby or intake data' })
        .eq('id', planId)
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    // Calculate age
    const age = calculateAge(baby.date_of_birth, baby.premature_weeks || 0)

    // Load relevant knowledge base files based on context
    const knowledgeBase = loadKnowledgeBase({
      ageMonths: baby.premature_weeks > 0 ? age.adjustedMonths : age.months,
      problems: intake.problems,
      cryingComfortLevel: intake.crying_comfort_level,
    })
    const additionalSleepTimes = getAdditionalSleepTimes(intake.data)
    const additionalSleepTimesLine = additionalSleepTimes.length > 0
      ? `- **Additional sleep periods:**\n${formatAdditionalSleepTimes(additionalSleepTimes)}`
      : '- **Additional sleep periods:** None'

    // Build the prompt
    const prompt = `You are an expert pediatric sleep consultant. Using the knowledge base provided and the specific information about this baby, create a detailed, personalized sleep plan.

## Knowledge Base
${knowledgeBase}

## Baby Information
- **Name:** ${baby.name}
- **Age:** ${age.months} months (${age.weeks} weeks)
${baby.premature_weeks > 0 ? `- **Adjusted Age:** ${age.adjustedMonths} months (born ${baby.premature_weeks} weeks early)` : ''}
    - **Temperament:** ${formatTemperament(baby.temperament)}
    ${baby.temperament_notes ? `- **Temperament Notes:** ${baby.temperament_notes}` : ''}
${baby.medical_conditions ? `- **Medical Notes:** ${baby.medical_conditions}` : ''}

## Current Sleep Situation
- **Current Bedtime:** ${intake.current_bedtime || 'Not specified'}
- **Current Wake Time:** ${intake.current_waketime || 'Not specified'}
- **Falling Asleep Method:** ${formatMethod(intake.falling_asleep_method)}
${additionalSleepTimesLine}

## Night Sleep
- **Night Wakings:** ${intake.night_wakings_count ?? 'Not specified'} times per night
- **Waking Duration:** ${formatDuration(intake.night_waking_duration)}
- **What Happens:** ${intake.night_wakings_description || 'Not specified'}
- **Pattern:** ${intake.night_waking_pattern || 'Not specified'}

## Naps
- **Naps Per Day:** ${intake.nap_count ?? 'Not specified'}
- **Nap Duration:** ${formatDuration(intake.nap_duration)}
- **Nap Method:** ${formatMethod(intake.nap_method)}
- **Nap Location:** ${formatLocation(intake.nap_location)}

## Sleep Challenges
${formatProblems(intake.problems)}
${intake.problem_description ? `\nDetails: ${intake.problem_description}` : ''}

## Parent Preferences
- **Comfort with Crying:** ${formatCryingLevel(intake.crying_comfort_level)}
${intake.parent_constraints ? `- **Constraints:** ${intake.parent_constraints}` : ''}

## Goals
${intake.success_description ? `- **What Success Looks Like:** ${intake.success_description}` : 'Not specified'}
${intake.additional_notes ? `- **Additional Notes:** ${intake.additional_notes}` : ''}

---

## Instructions

Create a warm, personalized sleep plan in Markdown format. Write like a supportive friend who happens to be a sleep consultant - conversational, encouraging, and practical.

### Writing Style:
- Write in flowing paragraphs, NOT bullet point lists
- Use a warm, encouraging tone like you're chatting over coffee
- Keep it personal - use ${baby.name}'s name naturally throughout
- Be specific with times and durations (bold key numbers)
- Avoid clinical/medical language - keep it friendly
- DO NOT use emojis anywhere in the text

### Formatting Rules:
- Use ## for main sections, ### for subsections
- Use --- between major sections
- Use **bold** for important times, durations, key terms
- Use numbered lists ONLY for step-by-step routines (max 5-6 steps)
- Use tables ONLY for schedules (keep them simple, max 4-5 rows)
- Use > blockquotes sparingly for special tips or encouragement
- Prefer paragraphs over bullet points - write conversationally!

### Content Structure:

# ${baby.name}'s Sleep Plan

## Your Plan at a Glance

Write 2-3 friendly paragraphs explaining what this plan covers and what the family can expect. End with an encouraging summary in a blockquote.

---

## Understanding ${baby.name}'s Sleep

Write 2-3 paragraphs about what's developmentally appropriate for this age, what's going well, and what we'll work on. Make parents feel understood, not judged.

---

## ${baby.name}'s Daily Rhythm

### Wake Windows
One brief paragraph explaining wake windows, then a simple table:
| Time of Day | Awake Time |
|-------------|------------|

### Sample Schedule
A simple table with 4-5 key times, then a paragraph about flexibility:
| Time | Activity |
|------|----------|

---

## The Bedtime Routine

Write a paragraph about why routines matter, then give 4-5 numbered steps. Keep descriptions brief. End with a tip in a blockquote.

---

## The Sleep Method

Write 2-3 paragraphs explaining the recommended approach based on parent comfort level (${formatCryingLevel(intake.crying_comfort_level)}). Be honest about what to expect. Use numbered steps only for the actual technique.

> Good to know: [Set realistic expectations in a supportive way]

---

## Your Specific Challenges

For each challenge, write a short paragraph explaining what's happening and why, then give practical advice in prose form (not bullets).

---

## Your First Few Weeks

Write this section in paragraphs, not lists. Describe what Week 1 looks like, then Week 2, then beyond. Include encouragement throughout.

> Remember: [Encouraging message about progress]

---

## Troubleshooting

Write 2-3 common scenarios as short paragraphs using the format:
**If [situation]:** then explain what to try in a sentence or two.

---

## Taking Care of You

A warm paragraph about self-care and when to reach out for help. End with an encouraging closing message.

> You've got this: [Final warm, personal encouragement]

---

Remember: Write like a friend, not a textbook. Paragraphs over bullets. Keep it warm and readable.`

    // Generate the plan with timeout
    console.log('Calling Gemini API...')
    const model = getModel()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000)
    })

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])

    console.log('Gemini API response received')
    const planContent = result.response.text()

    // Update the plan with generated content
    const { error: updateError } = await supabase
      .from('plans')
      .update({
        plan_content: planContent,
        status: 'completed',
      })
      .eq('id', planId)

    if (updateError) {
      console.error('Failed to update plan:', updateError)
      throw updateError
    }

    const { data: latestRevision } = await supabase
      .from('plan_revisions')
      .select('revision_number')
      .eq('plan_id', planId)
      .order('revision_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const revisionNumber = (latestRevision?.revision_number || 0) + 1
    const revisionSource = latestRevision ? 'manual' : 'initial'
    const revisionSummary = latestRevision ? 'Regenerated plan' : 'Initial plan'

    const { error: revisionError } = await supabase
      .from('plan_revisions')
      .insert({
        plan_id: planId,
        user_id: plan.user_id,
        revision_number: revisionNumber,
        plan_content: planContent,
        summary: revisionSummary,
        source: revisionSource,
      })

    if (revisionError) {
      console.error('Failed to save plan revision:', revisionError)
    }

    // Send plan ready email
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', plan.user_id)
        .single()

      if (profile?.email) {
        await sendPlanReadyEmail(profile.email, baby.name, planId)
      }
    } catch (emailError) {
      console.error('Failed to send plan ready email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, planId })
  } catch (error) {
    console.error('Plan generation error:', error)

    // Try to mark plan as failed
    if (planId) {
      try {
        const supabase = getSupabaseAdmin()
        await supabase
          .from('plans')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', planId)
      } catch (updateError) {
        console.error('Failed to update plan status:', updateError)
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate plan', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
