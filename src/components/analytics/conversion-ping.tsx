'use client'

import { useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/analytics/track'

interface ConversionPingProps {
  event: string
  params?: Record<string, unknown>
}

/**
 * Renders nothing; fires a GA4 event once when mounted. Used on
 * post-conversion pages (checkout success, etc.) where the landing
 * itself is the conversion signal.
 */
export function ConversionPing({ event, params }: ConversionPingProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackEvent(event, params)
  }, [event, params])

  return null
}
