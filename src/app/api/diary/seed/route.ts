import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const moods = ['great', 'good', 'okay', 'rough', 'terrible'] as const
const notesPool = [
  'Seeded entry: normal day, no disruptions.',
  'Seeded entry: short nap in the afternoon.',
  'Seeded entry: teething seemed to bother them overnight.',
  'Seeded entry: had a later bedtime due to family dinner.',
  'Seeded entry: woke earlier than usual.',
  'Seeded entry: longer morning nap, shorter afternoon nap.',
  'Seeded entry: extra fussiness around bedtime.',
  'Seeded entry: solid night, quick resettles.',
  'Seeded entry: skipped last nap.',
  'Seeded entry: mild congestion noted.',
] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, days } = body

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const totalDays = Math.max(1, Math.min(Number(days) || 7, 7))

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const today = new Date()
    const selectedDates: string[] = []
    for (let i = totalDays - 1; i >= 0; i -= 1) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      selectedDates.push(date.toISOString().split('T')[0])
    }

    const entries = selectedDates.map((dateStr, index) => {
      const nightWakings = Math.max(0, 4 - index + (index % 2))
      const napCount = Math.max(1, 3 - (index % 3))
      const nightWakingDuration = nightWakings > 0 ? 10 + index * 8 : 0
      const napTotalMinutes = napCount * (40 + (index % 3) * 15)
      const bedtimeHour = 19 + (index % 2)
      const wakeHour = 6 + (index % 2)
      return {
        plan_id: planId,
        user_id: user.id,
        date: dateStr,
        bedtime: `${bedtimeHour.toString().padStart(2, '0')}:${(15 + index * 5).toString().padStart(2, '0')}`,
        wake_time: `${wakeHour.toString().padStart(2, '0')}:${(10 + index * 3).toString().padStart(2, '0')}`,
        night_wakings: nightWakings,
        night_waking_duration: nightWakings > 0 ? nightWakingDuration : 0,
        nap_count: napCount,
        nap_total_minutes: napTotalMinutes,
        mood: moods[index % moods.length],
        notes: notesPool[index % notesPool.length],
      }
    })

    const { error: upsertError } = await supabase
      .from('sleep_diary_entries')
      .upsert(entries, { onConflict: 'plan_id,date' })

    if (upsertError) {
      console.error('Failed to seed diary entries:', upsertError)
      return NextResponse.json({ error: 'Failed to seed entries' }, { status: 500 })
    }

    return NextResponse.json({ success: true, days: selectedDates.length })
  } catch (error) {
    console.error('Seed diary error:', error)
    return NextResponse.json(
      { error: 'Failed to seed entries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
