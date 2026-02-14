function normalizeDate(value: Date | string): Date {
  if (value instanceof Date) return value
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`)
  }
  return new Date(value)
}

function formatWith(value: Date | string, formatter: Intl.DateTimeFormat): string {
  const date = normalizeDate(value)
  if (Number.isNaN(date.getTime())) {
    return typeof value === 'string' ? value : ''
  }
  return formatter.format(date)
}

const fullDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const monthDayFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
})

const weekdayShortFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
})

const weekdayMonthDayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const weekdayLongMonthDayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: '2-digit',
  month: 'short',
})

export function formatUniversalDate(value: Date | string): string {
  return formatWith(value, fullDateFormatter)
}

export function formatUniversalMonthDay(value: Date | string): string {
  return formatWith(value, monthDayFormatter)
}

export function formatUniversalWeekdayShort(value: Date | string): string {
  return formatWith(value, weekdayShortFormatter)
}

export function formatUniversalWeekdayMonthDay(value: Date | string): string {
  return formatWith(value, weekdayMonthDayFormatter)
}

export function formatUniversalWeekdayLongMonthDay(value: Date | string): string {
  return formatWith(value, weekdayLongMonthDayFormatter)
}
