import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

function parseDate(value: string): Date | undefined {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/how-it-works`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/science`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/compare`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/free-schedule`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/huckleberry-alternative`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/4-month-sleep-regression`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/toddler-sleep-2-year-old`, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${siteUrl}/red-flags`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: 'monthly', priority: 0.3 },
  ]

  const posts = getAllPosts()
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => {
    const lastModified = parseDate(post.dateModified) ?? parseDate(post.date)

    return {
      url: `${siteUrl}/blog/${post.slug}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'monthly',
      priority: 0.7,
    }
  })

  return [...staticPages, ...blogPages]
}
