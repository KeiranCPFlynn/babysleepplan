function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function isLocalhostOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

export function buildAuthCallbackUrl(nextPath: string) {
  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : ''
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const isLocalDev = process.env.NODE_ENV !== 'production'

  // During local development, always use the current origin to avoid
  // redirecting auth flows to the production site URL.
  const baseOrigin = isLocalDev && browserOrigin
    ? browserOrigin
    : browserOrigin && isLocalhostOrigin(browserOrigin)
      ? browserOrigin
      : configuredSiteUrl || browserOrigin

  const normalizedOrigin = trimTrailingSlash(baseOrigin)
  return `${normalizedOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`
}
