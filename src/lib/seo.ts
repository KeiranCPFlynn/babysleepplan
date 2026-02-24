import type { Metadata } from 'next'
import { getSiteUrl } from '@/lib/site-url'

type BuildMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

export function buildMarketingMetadata({
  title,
  description,
  path,
  keywords = [],
}: BuildMetadataInput): Metadata {
  const siteUrl = getSiteUrl()
  const canonicalPath = path.startsWith('/') ? path : `/${path}`
  const canonicalUrl = `${siteUrl}${canonicalPath}`

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}
