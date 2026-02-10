export function formatBabyAge(dateOfBirth: string): string {
  const birth = new Date(dateOfBirth)
  const now = new Date()
  const diffTime = Math.max(0, now.getTime() - birth.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(diffDays / 7)
  const months = Math.floor(diffDays / 30.44)
  const years = Math.floor(diffDays / 365.25)

  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} old`
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} old`
  return `${weeks} week${weeks > 1 ? 's' : ''} old`
}
