const DEFAULT_SITE_URL = 'https://lunacradle.com'

function normalizeSiteUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim()
  if (!trimmedUrl) return DEFAULT_SITE_URL

  const withProtocol = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`

  try {
    return new URL(withProtocol).origin
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
