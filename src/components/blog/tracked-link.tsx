'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackEvent } from '@/lib/analytics/track'

interface TrackedLinkProps {
  href: string
  event: string
  params?: Record<string, unknown>
  className?: string
  children: ReactNode
}

/**
 * Next Link that fires a GA4 event on click. Navigation is not
 * blocked while the event is sent.
 */
export function TrackedLink({ href, event, params, className, children }: TrackedLinkProps) {
  return (
    <Link href={href} className={className} onClick={() => trackEvent(event, params)}>
      {children}
    </Link>
  )
}
