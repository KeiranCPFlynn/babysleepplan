const DEFAULT_SITE_URL = 'https://www.lunacradle.com'
const APEX_HOST = 'lunacradle.com'
const CANONICAL_HOST = 'www.lunacradle.com'

function normalizeSiteUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim()
  if (!trimmedUrl) return DEFAULT_SITE_URL

  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`

  try {
    const parsedUrl = new URL(withProtocol)
    if (parsedUrl.hostname === APEX_HOST) {
      parsedUrl.hostname = CANONICAL_HOST
    }
    return parsedUrl.origin
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function getSiteUrl(): string {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_SITE_URL

  return normalizeSiteUrl(configuredUrl)
}
