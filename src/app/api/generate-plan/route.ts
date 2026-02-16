import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getModel } from '@/lib/gemini'
import { appendEvidenceSection, collectEvidenceSourcesForKnowledgeFiles } from '@/lib/plan-evidence'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { planGenerationLimiter } from '@/lib/rate-limit'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const isDev = process.env.NODE_ENV !== 'production'
export const runtime = 'nodejs'
export const maxDuration = 300
const PLAN_LOCK_LEASE_SECONDS = 8 * 60

const knowledgeFileCache = new Map<string, string | null>()

function loadKnowledgeFile(knowledgeDir: string, file: string) {
  if (knowledgeFileCache.has(file)) {
    return knowledgeFileCache.get(file)
  }
  try {
    const filePath = path.join(knowledgeDir, file)
    if (!fs.existsSync(filePath)) {
      knowledgeFileCache.set(file, null)
      return null
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    knowledgeFileCache.set(file, content)
    return content
  } catch (error) {
    knowledgeFileCache.set(file, null)
    if (isDev) {
      console.error(`Failed to load ${file}:`, error)
    }
    return null
  }
}

// Use service role for API (triggered by webhook)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isMissingLockFunctionError(error: { code?: string; message?: string } | null) {
  const message = (error?.message || '').toLowerCase()
  return error?.code === '42883' || message.includes('acquire_plan_generation_lock') || message.includes('release_plan_generation_lock')
}

async function acquirePlanGenerationLock(supabase: ReturnType<typeof getSupabaseAdmin>, planId: string, lockToken: string) {
  const { data, error } = await supabase.rpc('acquire_plan_generation_lock', {
    p_plan_id: planId,
    p_lock_token: lockToken,
    p_lease_seconds: PLAN_LOCK_LEASE_SECONDS,
  })

  if (error) {
    if (isMissingLockFunctionError(error)) {
      if (isDev) {
        console.warn('[generate-plan] lock function missing in dev; continuing without lock')
        return true
      }
      throw new Error('Missing database function acquire_plan_generation_lock. Run migration 016.')
    }
    throw error
  }

  return Boolean(data)
}

async function releasePlanGenerationLock(supabase: ReturnType<typeof getSupabaseAdmin>, planId: string, lockToken: string) {
  const { error } = await supabase.rpc('release_plan_generation_lock', {
    p_plan_id: planId,
    p_lock_token: lockToken,
  })

  if (error && !isMissingLockFunctionError(error)) {
    throw error
  }
}

// Smart knowledge base loader - only loads relevant files
interface KnowledgeContext {
  ageMonths: number
  problems: string[] | null
  cryingComfortLevel: number | null
  fallingAsleepMethod: string | null
  napMethod: string | null
  napLocation: string | null
  napDuration: string | null
  napCount: number | null
  nightWakingsCount: number | null
  nightWakingsDescription: string | null
  nightWakingPattern: string | null
  problemDescription: string | null
  parentConstraints: string | null
  additionalNotes: string | null
  medicalConditions: string | null
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term))
}

function loadKnowledgeBase(context: KnowledgeContext): { content: string; loadedFiles: string[] } {
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
  } else if (ageMonths < 24) {
    filesToLoad.push('age-18-24-months.txt')
  } else if (ageMonths < 36) {
    filesToLoad.push('age-24-36-months.txt')
  } else {
    // Fallback for older toddlers/preschoolers (and older if entered)
    filesToLoad.push('age-36-60-months.txt')
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

  // Heuristic boosts for common scenarios not always captured by checkbox problems.
  const combinedFreeText = [
    context.nightWakingsDescription || '',
    context.nightWakingPattern || '',
    context.problemDescription || '',
    context.parentConstraints || '',
    context.additionalNotes || '',
    context.medicalConditions || '',
  ]
    .join(' ')
    .toLowerCase()

  const sleepAssociationMethods = new Set(['nursing', 'rocking', 'holding', 'patting', 'cosleeping', 'stroller', 'other'])
  if (
    (context.fallingAsleepMethod && sleepAssociationMethods.has(context.fallingAsleepMethod)) ||
    (context.napMethod && sleepAssociationMethods.has(context.napMethod))
  ) {
    filesToLoad.push('problems-falling-asleep.txt')
  }

  const frequentNightWakeKeywords = ['hourly', 'every hour', 'every 45', 'every 60', 'multiple wakings', 'wakes often']
  if (
    (context.nightWakingsCount ?? 0) >= 3 ||
    includesAny(combinedFreeText, frequentNightWakeKeywords)
  ) {
    filesToLoad.push('problems-night-wakings.txt')
  }

  const shortNapKeywords = ['short nap', 'short naps', 'cat nap', 'catnap', 'nap refusal', 'nap resistant']
  if (
    context.napDuration === 'under_30' ||
    context.napDuration === '30_60' ||
    includesAny(combinedFreeText, shortNapKeywords)
  ) {
    filesToLoad.push('problems-short-naps.txt')
  }

  const likelyNightFeedWords = ['night feed', 'night feeding', 'overnight feed', 'overnight feeding', 'nurse to sleep', 'bottle to sleep', 'feed to sleep']
  if (
    context.ageMonths >= 6 &&
    (
      (context.problems || []).includes('night_feeds') ||
      includesAny(combinedFreeText, likelyNightFeedWords) ||
      (context.fallingAsleepMethod === 'nursing' && (context.nightWakingsCount ?? 0) >= 2)
    )
  ) {
    filesToLoad.push('night-weaning.txt')
  }

  const ageSuggestsNapTransition =
    (context.ageMonths >= 6 && context.ageMonths <= 11 && (context.napCount ?? 0) >= 3) ||
    (context.ageMonths >= 13 && context.ageMonths <= 20 && (context.napCount ?? 0) >= 2)

  if (ageSuggestsNapTransition) {
    filesToLoad.push('nap-transitions.txt')
  }

  const culturalKeywords = [
    'co-sleep',
    'cosleep',
    'bed share',
    'bed-sharing',
    'same bed',
    'room share',
    'room-sharing',
    'grandparent',
    'grandmother',
    'grandfather',
    'culture',
    'cultural',
    'tradition',
    'traditional',
    'religion',
    'religious',
  ]

  if (
    context.fallingAsleepMethod === 'cosleeping' ||
    context.napLocation === 'parent_bed' ||
    includesAny(combinedFreeText, culturalKeywords)
  ) {
    filesToLoad.push('cultural-considerations.txt')
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
  const loadedFiles: string[] = []

  for (const file of uniqueFiles) {
    const content = loadKnowledgeFile(knowledgeDir, file)
    if (content) {
      knowledge += `\n\n--- ${file} ---\n${content}`
      loadedCount++
      loadedFiles.push(file)
    } else if (isDev) {
      console.warn(`Knowledge file not found: ${file}`)
    }
  }

  if (isDev) {
    console.log(`Loaded ${loadedCount} relevant knowledge files: ${uniqueFiles.join(', ')}`)
    console.log(`Knowledge base size: ${knowledge.length.toLocaleString()} characters`)
  }

  if (loadedCount === 0) {
    throw new Error('Failed to load any knowledge files')
  }

  return { content: knowledge, loadedFiles }
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
  let generationTimeout: NodeJS.Timeout | undefined
  let lockToken: string | undefined
  let lockAcquired = false

  try {
    // Verify authorization: internal API key OR authenticated user who owns the plan
    const authHeader = request.headers.get('authorization')
    const internalKey = process.env.INTERNAL_API_KEY
    if (!internalKey) {
      console.error('INTERNAL_API_KEY is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }
    const isInternalCall = authHeader === `Bearer ${internalKey}`

    const body = await request.json()
    planId = body.planId

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }
    console.log('[generate-plan] request received', { planId, isInternalCall })

    // If not an internal call, verify user owns the plan
    if (!isInternalCall) {
      const userSupabase = await createServerClient()
      const { data: { user } } = await userSupabase.auth.getUser()
      if (!user) {
        console.error('[generate-plan] unauthorized request (no user)', { planId })
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Verify plan ownership
      const { data: ownedPlan } = await userSupabase
        .from('plans')
        .select('id, status')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single()
      if (!ownedPlan) {
        console.error('[generate-plan] unauthorized request (ownership check failed)', { planId, userId: user.id })
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const isRetryableStatus = ownedPlan.status === 'generating' || ownedPlan.status === 'failed'
      // Allow retries for in-progress/failed plans (success-page fallback) without
      // counting against user generation limits.
      if (!isRetryableStatus) {
        const rateCheck = planGenerationLimiter.check(user.id)
        if (rateCheck.limited) {
          return NextResponse.json(
            { error: 'Too many plan generation requests. Please try again later.' },
            { status: 429 }
          )
        }
      }
    }

    if (isDev) {
      console.log('Starting plan generation for:', planId)
    }

    const supabase = getSupabaseAdmin()

    // Get plan first
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError) {
      console.error('Failed to fetch plan:', planError)
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    if (isDev) {
      console.log('Fetched plan:', { id: plan.id, status: plan.status, baby_id: plan.baby_id, intake_submission_id: plan.intake_submission_id })
    }

    // Skip if already completed before attempting to lock.
    if (plan.status === 'completed') {
      return NextResponse.json({ error: 'Plan already generated' }, { status: 400 })
    }

    lockToken = randomUUID()
    lockAcquired = await acquirePlanGenerationLock(supabase, planId, lockToken)
    if (!lockAcquired) {
      return NextResponse.json({ success: true, queued: true, message: 'Generation already in progress' }, { status: 202 })
    }

    // Add timeout protection for plan generation
    generationTimeout = setTimeout(async () => {
      if (isDev) {
        console.log(`Plan generation timeout for plan ${planId} - marking as failed`)
      }
      try {
        await supabase
          .from('plans')
          .update({
            status: 'failed',
            error_message: 'Plan generation timeout - took longer than 5 minutes'
          })
          .eq('id', planId)
      } catch (timeoutError) {
        console.error('Failed to mark plan as timed out:', timeoutError)
      }
    }, 5 * 60 * 1000) // 5 minute timeout

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

    if (isDev) {
      console.log('Fetched related data:', { hasBaby: !!baby, hasIntake: !!intake })
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
    const { content: knowledgeBase, loadedFiles } = loadKnowledgeBase({
      ageMonths: baby.premature_weeks > 0 ? age.adjustedMonths : age.months,
      problems: intake.problems,
      cryingComfortLevel: intake.crying_comfort_level,
      fallingAsleepMethod: intake.falling_asleep_method,
      napMethod: intake.nap_method,
      napLocation: intake.nap_location,
      napDuration: intake.nap_duration,
      napCount: intake.nap_count,
      nightWakingsCount: intake.night_wakings_count,
      nightWakingsDescription: intake.night_wakings_description,
      nightWakingPattern: intake.night_waking_pattern,
      problemDescription: intake.problem_description,
      parentConstraints: intake.parent_constraints,
      additionalNotes: intake.additional_notes,
      medicalConditions: baby.medical_conditions,
    })
    const additionalSleepTimes = getAdditionalSleepTimes(intake.data)
    const additionalSleepTimesLine = additionalSleepTimes.length > 0
      ? `- **Additional sleep periods:**\n${formatAdditionalSleepTimes(additionalSleepTimes)}`
      : '- **Additional sleep periods:** None'

    // Sanitize user-controlled fields before prompt interpolation
    const safeBabyName = sanitizeForPrompt(baby.name, 100)
    const safeTemperamentNotes = baby.temperament_notes ? sanitizeForPrompt(baby.temperament_notes, 500) : ''
    const safeMedicalConditions = baby.medical_conditions ? sanitizeForPrompt(baby.medical_conditions, 500) : ''
    const safeNightWakingsDesc = intake.night_wakings_description ? sanitizeForPrompt(intake.night_wakings_description, 1000) : 'Not specified'
    const safeNightWakingPattern = intake.night_waking_pattern ? sanitizeForPrompt(intake.night_waking_pattern, 1000) : 'Not specified'
    const safeProblemDescription = intake.problem_description ? sanitizeForPrompt(intake.problem_description, 2000) : ''
    const safeParentConstraints = intake.parent_constraints ? sanitizeForPrompt(intake.parent_constraints, 1000) : ''
    const safeSuccessDescription = intake.success_description ? sanitizeForPrompt(intake.success_description, 1000) : ''
    const safeAdditionalNotes = intake.additional_notes ? sanitizeForPrompt(intake.additional_notes, 1000) : ''

    // Build the prompt
    const prompt = `You are an expert pediatric sleep consultant. Using the knowledge base provided and the specific information about this baby, create a detailed, personalized sleep plan.

## Knowledge Base
${knowledgeBase}

## Baby Information
- **Name:** ${safeBabyName}
- **Age:** ${age.months} months (${age.weeks} weeks)
${baby.premature_weeks > 0 ? `- **Adjusted Age:** ${age.adjustedMonths} months (born ${baby.premature_weeks} weeks early)` : ''}
    - **Temperament:** ${formatTemperament(baby.temperament)}
    ${safeTemperamentNotes ? `- **Temperament Notes:** ${safeTemperamentNotes}` : ''}
${safeMedicalConditions ? `- **Medical Notes:** ${safeMedicalConditions}` : ''}

## Current Sleep Situation
- **Current Bedtime:** ${intake.current_bedtime || 'Not specified'}
- **Current Wake Time:** ${intake.current_waketime || 'Not specified'}
- **Falling Asleep Method:** ${formatMethod(intake.falling_asleep_method)}
${additionalSleepTimesLine}

## Night Sleep
- **Night Wakings:** ${intake.night_wakings_count ?? 'Not specified'} times per night
- **Waking Duration:** ${formatDuration(intake.night_waking_duration)}
- **What Happens:** ${safeNightWakingsDesc}
- **Pattern:** ${safeNightWakingPattern}

## Naps
- **Naps Per Day:** ${intake.nap_count ?? 'Not specified'}
- **Nap Duration:** ${formatDuration(intake.nap_duration)}
- **Nap Method:** ${formatMethod(intake.nap_method)}
- **Nap Location:** ${formatLocation(intake.nap_location)}

## Sleep Challenges
${formatProblems(intake.problems)}
${safeProblemDescription ? `\nDetails: ${safeProblemDescription}` : ''}

## Parent Preferences
- **Comfort with Crying:** ${formatCryingLevel(intake.crying_comfort_level)}
${safeParentConstraints ? `- **Constraints:** ${safeParentConstraints}` : ''}

## Goals
${safeSuccessDescription ? `- **What Success Looks Like:** ${safeSuccessDescription}` : 'Not specified'}
${safeAdditionalNotes ? `- **Additional Notes:** ${safeAdditionalNotes}` : ''}

---

## Instructions

Create a warm, personalized sleep plan in Markdown format. Write like a supportive sleep consultant: conversational, practical, and honest about uncertainty.

### Writing Style:
- Write in flowing paragraphs, NOT bullet point lists
- Use a warm, steady tone without hype
- Keep it personal - use ${safeBabyName}'s name naturally throughout
- Be specific with times and durations (bold key numbers)
- Avoid clinical/medical language - keep it friendly
- Anchor encouragement to concrete details from the intake and age context
- If you reassure, tie it to one observable fact and one next step
- Use calibrated language where needed (for example: "based on what you shared", "a likely pattern", "we'll adjust after a few days of logs")
- Avoid generic praise or certainty claims. Do NOT use phrases like "you're doing amazing", "you're doing great", or "you've got this"
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

# ${safeBabyName}'s Sleep Plan

## Your Plan at a Glance

Write 2-3 friendly paragraphs explaining what this plan covers and what the family can expect. End with a short grounded reassurance in a blockquote that references one concrete family goal or constraint.

---

## Understanding ${safeBabyName}'s Sleep

Write 2-3 paragraphs about what's developmentally appropriate for this age, what's going well, and what we'll work on. Make parents feel understood, not judged.

---

## ${safeBabyName}'s Daily Rhythm

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

Write this section in paragraphs, not lists. Describe what Week 1 looks like, then Week 2, then beyond. Keep encouragement realistic and tied to observable progress markers.

> Remember: [Grounded reassurance linked to a specific progress marker]

---

## Troubleshooting

Write 2-3 common scenarios as short paragraphs using the format:
**If [situation]:** then explain what to try in a sentence or two.

---

## Taking Care of You

A warm paragraph about self-care and when to reach out for help. End with a grounded closing message that avoids generic praise.

> Next step: [Specific, manageable action for this week]

---

Remember: Write like a skilled, supportive human coach, not a cheerleader. Paragraphs over bullets. Keep it warm, specific, and credible.`

    // Generate the plan with timeout
    if (isDev) {
      console.log('Calling Gemini API...')
    }
    const model = getModel()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 120 seconds')), 120000)
    })

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])

    if (isDev) {
      console.log('Gemini API response received')
    }
    const rawPlanContent = result.response.text()
    const evidenceSources = collectEvidenceSourcesForKnowledgeFiles(loadedFiles)
    const planContent = appendEvidenceSection(rawPlanContent, evidenceSources)

    // Clear the timeout since generation completed successfully
    clearTimeout(generationTimeout)

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
    console.log('[generate-plan] completed', { planId })

    return NextResponse.json({ success: true, planId })
  } catch (error) {
    console.error('Plan generation error:', error)

    // Clear timeout on error
    if (generationTimeout) {
      clearTimeout(generationTimeout)
    }

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
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  } finally {
    if (generationTimeout) {
      clearTimeout(generationTimeout)
    }

    if (planId && lockToken && lockAcquired) {
      try {
        const supabase = getSupabaseAdmin()
        await releasePlanGenerationLock(supabase, planId, lockToken)
      } catch (releaseError) {
        console.error('[generate-plan] failed to release lock:', releaseError)
      }
    }
  }
}
