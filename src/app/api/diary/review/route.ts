import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModel } from '@/lib/gemini'
import { hasActiveSubscription } from '@/lib/subscription'
import fs from 'fs'
import path from 'path'

const isDev = process.env.NODE_ENV !== 'production'
const reviewKnowledgeCache = new Map<string, string | null>()

function loadReviewFile(knowledgeDir: string, file: string) {
  if (reviewKnowledgeCache.has(file)) {
    return reviewKnowledgeCache.get(file)
  }
  try {
    const filePath = path.join(knowledgeDir, file)
    if (!fs.existsSync(filePath)) {
      reviewKnowledgeCache.set(file, null)
      return null
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    reviewKnowledgeCache.set(file, content)
    return content
  } catch (error) {
    reviewKnowledgeCache.set(file, null)
    if (isDev) {
      console.error(`Failed to load ${file}:`, error)
    }
    return null
  }
}

// Load relevant knowledge base files for weekly review
function loadReviewKnowledge(ageMonths: number): string {
  const knowledgeDir = path.join(process.cwd(), 'src/data/knowledge')
  const filesToLoad: string[] = []

  // Core principles for context
  filesToLoad.push('core-principles.txt')

  // Age-appropriate guidance
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

  // Regressions (commonly relevant for reviews)
  filesToLoad.push('regressions.txt')

  let knowledge = ''
  for (const file of filesToLoad) {
    const content = loadReviewFile(knowledgeDir, file)
    if (content) {
      knowledge += `\n\n--- ${file} ---\n${content}`
    } else if (isDev) {
      console.warn(`Knowledge file not found: ${file}`)
    }
  }

  return knowledge
}

// Calculate baby's age in months
function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  const diffTime = now.getTime() - birth.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 30.44)
}

// Format diary entries for the prompt
function formatDiaryEntries(entries: Array<{
  date: string
  bedtime: string | null
  wake_time: string | null
  night_wakings: number
  night_waking_duration: number | null
  nap_count: number
  nap_total_minutes: number
  mood: string | null
  notes: string | null
}>): string {
  if (entries.length === 0) return 'No entries logged this week.'

  return entries
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      const lines = [`**${date}**`]

      if (entry.bedtime) lines.push(`- Bedtime: ${entry.bedtime}`)
      if (entry.wake_time) lines.push(`- Wake time: ${entry.wake_time}`)
      if (entry.night_wakings > 0) {
        lines.push(`- Night wakings: ${entry.night_wakings}${entry.night_waking_duration ? ` (${entry.night_waking_duration} min total)` : ''}`)
      } else {
        lines.push('- Night wakings: 0')
      }
      if (entry.nap_count > 0) {
        lines.push(`- Naps: ${entry.nap_count} (${entry.nap_total_minutes} min total)`)
      }
      if (entry.mood) lines.push(`- Mood: ${entry.mood}`)
      if (entry.notes) lines.push(`- Notes: ${entry.notes}`)

      return lines.join('\n')
    })
    .join('\n\n')
}

// POST: Generate a weekly AI review
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, weekStart, weekEnd } = body

    if (!planId || !weekStart || !weekEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the plan with baby and intake info
    const [planResult, profileResult] = await Promise.all([
      supabase
        .from('plans')
        .select(`
          *,
          baby:babies(*),
          intake:intake_submissions(*)
        `)
        .eq('id', planId)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('subscription_status')
        .eq('id', user.id)
        .single(),
    ])

    const { data: plan, error: planError } = planResult
    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const { data: profile } = profileResult

    const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
    if (!hasActiveSubscription(profile?.subscription_status, isStripeEnabled)) {
      return NextResponse.json({ error: 'Subscription required to generate reviews' }, { status: 402 })
    }

    // Get diary entries for the week
    const { data: entries, error: entriesError } = await supabase
      .from('sleep_diary_entries')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date', { ascending: true })

    if (entriesError) {
      console.error('Failed to fetch diary entries:', entriesError)
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
    }

    if (!entries || entries.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 days logged to generate a review' },
        { status: 400 }
      )
    }

    // Calculate baby's age
    const ageMonths = calculateAgeMonths(plan.baby.date_of_birth)

    // Load knowledge base
    const knowledgeBase = loadReviewKnowledge(ageMonths)

    // Get first ~500 chars of plan for context
    const planSummary = plan.plan_content?.substring(0, 1500) || 'No plan content available'

    // Build the prompt
    const prompt = `You are a supportive sleep consultant reviewing a week of sleep diary entries.

## Knowledge Base
${knowledgeBase}

## Baby Information
- Name: ${plan.baby.name}
- Age: ${ageMonths} months
- Temperament: ${plan.baby.temperament || 'Not specified'}

## Original Goals (from intake)
${plan.intake?.success_description || 'Not specified'}
${plan.intake?.additional_notes ? `\nAdditional notes: ${plan.intake.additional_notes}` : ''}

## Original Plan Summary
${planSummary}

## This Week's Sleep Log
${formatDiaryEntries(entries)}

---

Write a brief, warm review in Markdown that matches the tone and structure of the plan:

## Weekly Review

### This Week's Wins
2-3 sentences highlighting positives.

### Patterns from the Diary
2-3 sentences that clearly reference the diary entries (bedtime/wake time, night wakings, naps, mood, notes). Include at least TWO specific observations tied to the log.

### Focus for Next Week
2-3 sentences with ONE specific, actionable suggestion.

End with a blockquote encouragement like:
> You're doing great. Consistency now will pay off soon.

Keep it conversational and supportive. No emojis.`

    // Generate the review
    if (isDev) {
      console.log('Generating weekly review for plan:', planId)
    }
    const model = getModel()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI review timeout after 60 seconds')), 60000)
    })

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])

    const reviewContent = result.response.text()

    // Save the review (upsert by plan_id + week_start)
    const { data: review, error: saveError } = await supabase
      .from('weekly_reviews')
      .upsert(
        {
          plan_id: planId,
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          review_content: reviewContent,
        },
        {
          onConflict: 'plan_id,week_start',
        }
      )
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save review:', saveError)
      return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (error) {
    console.error('Review generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET: Fetch existing reviews for a plan
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const planId = searchParams.get('planId')

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const { data: reviews, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })

    if (error) {
      console.error('Failed to fetch reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Review GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
