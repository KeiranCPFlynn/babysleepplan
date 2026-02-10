'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value?: string | null
  onChange: (value: string) => void
  id?: string
  disabled?: boolean
  className?: string
}

function parse24(value: string | null | undefined) {
  if (!value || !value.includes(':')) return { hour: '', minute: '', period: 'PM' as const }
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr, 10)
  if (isNaN(h24)) return { hour: '', minute: '', period: 'PM' as const }
  const period = h24 >= 12 ? 'PM' as const : 'AM' as const
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  return { hour: String(h12), minute: mStr || '00', period }
}

function to24(hour: string, minute: string, period: string): string {
  if (!hour || !minute) return ''
  let h24 = parseInt(hour, 10)
  if (isNaN(h24)) return ''
  if (period === 'AM' && h24 === 12) h24 = 0
  else if (period === 'PM' && h24 !== 12) h24 += 12
  return `${String(h24).padStart(2, '0')}:${minute.padStart(2, '0')}`
}

export function TimePicker({ value, onChange, id, disabled, className }: TimePickerProps) {
  const initial = parse24(value)
  const [hour, setHour] = useState(initial.hour)
  const [minute, setMinute] = useState(initial.minute)
  const [period, setPeriod] = useState(initial.period)
  const lastEmitted = useRef(value || '')

  // Sync inbound prop → local state (only when prop changes externally)
  useEffect(() => {
    const incoming = value || ''
    if (incoming !== lastEmitted.current) {
      const p = parse24(incoming)
      setHour(p.hour)
      setMinute(p.minute)
      setPeriod(p.period)
      lastEmitted.current = incoming
    }
  }, [value])

  function emitChange(h: string, m: string, p: string) {
    const result = to24(h, m, p)
    lastEmitted.current = result
    onChange(result)
  }

  function handleHour(h: string) {
    setHour(h)
    const m = minute || '00'
    if (!minute) setMinute(m)
    emitChange(h, m, period)
  }

  function handleMinute(m: string) {
    setMinute(m)
    emitChange(hour, m, period)
  }

  function handlePeriod(p: string) {
    setPeriod(p as 'AM' | 'PM')
    const m = minute || '00'
    if (!minute) setMinute(m)
    emitChange(hour, m, p)
  }

  const selectClass = cn(
    'h-10 rounded-md border border-input bg-white px-2 py-1 text-base shadow-sm outline-none cursor-pointer',
    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
    'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
  )

  return (
    <div id={id} className={cn('flex items-center gap-1.5', className)}>
      <select
        aria-label="Hour"
        disabled={disabled}
        value={hour}
        onChange={(e) => handleHour(e.target.value)}
        className={cn(selectClass, 'w-[4.5rem]')}
      >
        <option value="">Hr</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={String(h)}>{h}</option>
        ))}
      </select>

      <span className="text-lg font-medium text-slate-400 select-none">:</span>

      <select
        aria-label="Minute"
        disabled={disabled}
        value={minute}
        onChange={(e) => handleMinute(e.target.value)}
        className={cn(selectClass, 'w-[4.5rem]')}
      >
        <option value="">Min</option>
        {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        aria-label="AM or PM"
        disabled={disabled}
        value={period}
        onChange={(e) => handlePeriod(e.target.value)}
        className={cn(selectClass, 'w-[4.5rem]')}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}
