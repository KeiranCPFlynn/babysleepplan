import { getAllPosts } from '@/lib/blog'
import { getSiteUrl } from '@/lib/site-url'

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function parseDate(value: string): Date | undefined {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function GET() {
  const siteUrl = getSiteUrl()
  const posts = getAllPosts()

  const urls = posts
    .map((post) => {
      const lastModified = parseDate(post.dateModified) ?? parseDate(post.date)
      const lastmod = lastModified
        ? `\n<lastmod>${lastModified.toISOString()}</lastmod>`
        : ''

      return `<url>
<loc>${escapeXml(`${siteUrl}/blog/${post.slug}`)}</loc>${lastmod}
<changefreq>monthly</changefreq>
<priority>0.7</priority>
</url>`
    })
    .join('\n')

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    }
  )
}
