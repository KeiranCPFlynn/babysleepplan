type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
}

/**
 * Fire a GA4 event. Safe on the server and when GA failed to load:
 * the call is dropped instead of throwing.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  ;(window as GtagWindow).gtag?.('event', name, params)
}
