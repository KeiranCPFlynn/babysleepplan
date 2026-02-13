/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/**
 * Sanitize a string for safe use in an email subject line.
 * Strips newlines to prevent header injection.
 */
export function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]/g, '')
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /system\s*prompt/i,
  /you\s+are\s+now/i,
  /new\s+instructions?:/i,
  /override\s+(the\s+)?system/i,
  /pretend\s+you\s+are/i,
  /act\s+as\s+(if|a)/i,
  /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
]

/**
 * Sanitize user input before interpolating into AI prompts.
 * - Strips common prompt injection patterns
 * - Truncates to a max length
 * - Wraps in clear delimiters
 */
export function sanitizeForPrompt(input: string, maxLength: number = 2000): string {
  let sanitized = input.slice(0, maxLength)

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]')
  }

  return `<user_input>${sanitized}</user_input>`
}
