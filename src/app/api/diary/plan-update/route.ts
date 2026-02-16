import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getModel } from '@/lib/gemini'
import { hasActiveSubscription } from '@/lib/subscription'
import { sanitizeForPrompt } from '@/lib/sanitize'
import { planUpdateLimiter } from '@/lib/rate-limit'
import { formatUniversalDate, formatUniversalWeekdayLongMonthDay } from '@/lib/date-format'

function calculateAgeMonths(dob: string): number {
  const birth = new Date(dob)
  const now = new Date()
  const diffTime = now.getTime() - birth.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 30.44)
}

function formatWeekLabel(weekStart: string) {
  return formatUniversalDate(weekStart)
}

function getWindowDays(value: unknown) {
  return value === 3 ? 3 : 7
}

const THREE_DAY_COOLDOWN_HOURS = 72

function diffDaysBetween(start: string | null, end: string | null) {
  if (!start || !end) return null
  const startDate = new Date(start + 'T12:00:00Z')
  const endDate = new Date(end + 'T12:00:00Z')
  const diffMs = endDate.getTime() - startDate.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

function isThreeDayWindowRevision(weekStart: string | null, weekEnd: string | null) {
  return diffDaysBetween(weekStart, weekEnd) === 2
}

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
      const date = formatUniversalWeekdayLongMonthDay(entry.date)
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

function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  const parsedHours = Number(hours)
  const parsedMinutes = Number(minutes)
  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) return null
  return parsedHours * 60 + parsedMinutes
}

function formatMinutesToTime(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + (24 * 60)) % (24 * 60)
  const hours24 = Math.floor(normalized / 60)
  const mins = normalized % 60
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = ((hours24 + 11) % 12) + 1
  return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`
}

function buildWhyThisChangeParagraph(entries: Array<{
  bedtime: string | null
  wake_time: string | null
  night_wakings: number
  night_waking_duration: number | null
  nap_count: number
  nap_total_minutes: number
  mood: string | null
}>): string {
  const totalEntries = entries.length || 1
  const totalNightWakings = entries.reduce((sum, entry) => sum + (entry.night_wakings || 0), 0)
  const nightsWithWakings = entries.filter(entry => entry.night_wakings > 0).length
  const totalWakingMinutes = entries.reduce((sum, entry) => sum + (entry.night_waking_duration || 0), 0)
  const avgNightWakings = Math.round((totalNightWakings / totalEntries) * 10) / 10

  const totalNapCount = entries.reduce((sum, entry) => sum + (entry.nap_count || 0), 0)
  const totalNapMinutes = entries.reduce((sum, entry) => sum + (entry.nap_total_minutes || 0), 0)
  const avgNapCount = Math.round((totalNapCount / totalEntries) * 10) / 10
  const avgNapMinutes = Math.round(totalNapMinutes / totalEntries)

  const bedtimes = entries.map(entry => parseTimeToMinutes(entry.bedtime)).filter((value): value is number => value !== null)
  const wakeTimes = entries.map(entry => parseTimeToMinutes(entry.wake_time)).filter((value): value is number => value !== null)

  const observations: string[] = []

  if (totalNightWakings === 0) {
    observations.push(`In the diary entries, night wakings were 0 across all ${totalEntries} nights.`)
  } else {
    const wakingNote = totalWakingMinutes > 0 ? ` Total awake time was about ${totalWakingMinutes} minutes.` : ''
    observations.push(`In the diary entries, night wakings happened on ${nightsWithWakings} of ${totalEntries} nights (total ${totalNightWakings}, about ${avgNightWakings} per night).${wakingNote}`)
  }

  if (totalNapCount > 0 || totalNapMinutes > 0) {
    observations.push(`Across the diary, naps averaged ${avgNapCount} per day for about ${avgNapMinutes} minutes total.`)
  } else if (bedtimes.length >= 2) {
    const minBedtime = formatMinutesToTime(Math.min(...bedtimes))
    const maxBedtime = formatMinutesToTime(Math.max(...bedtimes))
    observations.push(`Across the diary, bedtimes ranged from ${minBedtime} to ${maxBedtime}.`)
  } else if (wakeTimes.length >= 2) {
    const minWake = formatMinutesToTime(Math.min(...wakeTimes))
    const maxWake = formatMinutesToTime(Math.max(...wakeTimes))
    observations.push(`Across the diary, wake times ranged from ${minWake} to ${maxWake}.`)
  } else {
    observations.push(`Across the diary, you logged sleep details for ${totalEntries} days, giving us a clear snapshot of the week.`)
  }

  if (observations.length < 2) {
    observations.push(`Across the diary, you logged sleep details for ${totalEntries} days, giving us a clear snapshot of the week.`)
  }

  return `**Why this change:** ${observations[0]} ${observations[1]}`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit per user
    const rateCheck = planUpdateLimiter.check(user.id)
    if (rateCheck.limited) {
      return NextResponse.json(
        { error: 'Too many plan update requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { planId, weekStart, weekEnd } = body
    const windowDays = getWindowDays(body.windowDays)
    const windowLabel = windowDays === 3 ? 'last 3 days' : 'last 7 days'
    const isDevMode = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'false'
    const force = isDevMode && new URL(request.url).searchParams.get('force') === 'true'

    if (!planId || !weekStart || !weekEnd) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    if (plan.status !== 'completed') {
      return NextResponse.json({ error: 'Plan not completed yet' }, { status: 400 })
    }

    const { data: profile } = profileResult

    const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
    if (!hasActiveSubscription(profile?.subscription_status, isStripeEnabled) && !force) {
      return NextResponse.json({ error: 'Subscription required to update the plan' }, { status: 402 })
    }

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

    if (!entries || entries.length < windowDays) {
      return NextResponse.json(
        { error: `Need at least ${windowDays} days logged to update the plan` },
        { status: 400 }
      )
    }

    if (windowDays === 3 && !force) {
      const { data: recentUpdates, error: recentUpdatesError } = await supabase
        .from('plan_revisions')
        .select('id, created_at, week_start, week_end')
        .eq('plan_id', planId)
        .eq('user_id', user.id)
        .eq('source', 'weekly-review')
        .order('created_at', { ascending: false })
        .limit(20)

      if (recentUpdatesError) {
        console.error('Failed to check recent 3-day updates:', recentUpdatesError)
        return NextResponse.json({ error: 'Failed to check update cooldown' }, { status: 500 })
      }

      const latestThreeDayUpdate = (recentUpdates || []).find((revision) =>
        isThreeDayWindowRevision(revision.week_start, revision.week_end)
      )

      if (latestThreeDayUpdate?.created_at) {
        const createdAt = new Date(latestThreeDayUpdate.created_at)
        const cooldownUntil = new Date(createdAt.getTime() + (THREE_DAY_COOLDOWN_HOURS * 60 * 60 * 1000))
        if (Date.now() < cooldownUntil.getTime()) {
          return NextResponse.json(
            {
              error: '3-day update is on cooldown. Please try again in 72 hours.',
              cooldown_until: cooldownUntil.toISOString(),
            },
            { status: 429 }
          )
        }
      }
    }

    const { data: review } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle()

    const { data: existingUpdate } = await supabase
      .from('plan_revisions')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('source', 'weekly-review')
      .maybeSingle()

    if (existingUpdate && !force) {
      return NextResponse.json({ error: `Plan already updated for this ${windowDays}-day window` }, { status: 400 })
    }

    const { data: latestRevision } = await supabase
      .from('plan_revisions')
      .select('revision_number')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .order('revision_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    let nextRevisionNumber = (latestRevision?.revision_number || 0) + 1

    if (!latestRevision && plan.plan_content) {
      const { error: initialRevisionError } = await supabase
        .from('plan_revisions')
        .insert({
          plan_id: planId,
          user_id: user.id,
          revision_number: 1,
          plan_content: plan.plan_content,
          summary: 'Initial plan',
          source: 'initial',
        })

      if (initialRevisionError) {
        console.error('Failed to create initial plan revision:', initialRevisionError)
        return NextResponse.json({ error: 'Failed to create plan history' }, { status: 500 })
      }

      nextRevisionNumber = 2
    }

    const ageMonths = calculateAgeMonths(plan.baby.date_of_birth)
    const weekLabel = formatWeekLabel(weekStart)
    const weekEndLabel = formatUniversalDate(weekEnd)
    const heading = windowDays === 3
      ? `## Plan Update - Last 3 Days (through ${weekEndLabel})`
      : `## Plan Update — Week of ${weekLabel}`
    const planContent = plan.plan_content || ''

    // Sanitize user-controlled fields
    const safeBabyName = sanitizeForPrompt(plan.baby.name, 100)

    const prompt = `You are updating an existing baby sleep plan based on ${windowLabel} of diary entries${review ? ' and the weekly review' : ''}. Do NOT rewrite the full plan. Write a concise update section that will be appended to the plan.

## Baby Info
- Name: ${safeBabyName}
- Age: ${ageMonths} months
- Temperament: ${plan.baby.temperament || 'Not specified'}

## Current Plan (for context)
${planContent}

${review ? `## Weekly Review\n${review.review_content}\n` : ''}

## Sleep Log (${windowLabel})
${formatDiaryEntries(entries)}

---

Write a new section in Markdown that starts with this exact heading:
${heading}

Then write 3-5 short paragraphs:
1) What to keep doing (what's working)
2) What to adjust (one specific change)
3) A paragraph that starts with "**Why this change:**" and explicitly references the diary with at least TWO concrete observations
4) Any caution or context for the next ${windowDays === 3 ? 'few days' : 'week'}

You may include ONE short numbered routine (max 3 steps) if it helps.
No bullet lists otherwise. No emojis.
Keep the tone warm, specific, and evidence-grounded.
If you include encouragement, tie it to one concrete observation and one clear next action.
Avoid generic praise phrases such as "you're doing amazing", "you're doing great", or "you've got this".
Return ONLY the Markdown for the new section.`

    const model = getModel()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI update timeout after 60 seconds')), 60000)
    })

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ])

    const updateSection = result.response.text().trim()
    const hasWhyThisChange = /why this change/i.test(updateSection)
    const updateSectionWithWhy = hasWhyThisChange
      ? updateSection
      : `${updateSection}\n\n${buildWhyThisChangeParagraph(entries)}`

    const divider = planContent.trim().length > 0 ? '\n\n---\n\n' : ''
    const updatedPlanContent = `${planContent.trim()}${divider}${updateSectionWithWhy}\n`

    const { error: updatePlanError } = await supabase
      .from('plans')
      .update({
        plan_content: updatedPlanContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId)
      .eq('user_id', user.id)

    if (updatePlanError) {
      console.error('Failed to update plan:', updatePlanError)
      return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
    }

    const { data: revision, error: revisionError } = await supabase
      .from('plan_revisions')
      .insert({
        plan_id: planId,
        user_id: user.id,
        revision_number: nextRevisionNumber,
        plan_content: updatedPlanContent,
        summary: windowDays === 3
          ? `3-day update through ${weekEndLabel}`
          : `Update for week of ${weekLabel}`,
        source: 'weekly-review',
        week_start: weekStart,
        week_end: weekEnd,
      })
      .select()
      .single()

    if (revisionError) {
      console.error('Failed to save plan revision:', revisionError)
      return NextResponse.json({ error: 'Failed to save plan revision' }, { status: 500 })
    }

    return NextResponse.json({ revision, updateSection: updateSectionWithWhy })
  } catch (error) {
    console.error('Plan update error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
