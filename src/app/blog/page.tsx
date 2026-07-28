import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { PostCard } from '@/components/blog/post-card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Baby Sleep Schedule & Tips by Age — Complete Guides | LunaCradle',
  description:
    '65+ evidence-based baby sleep guides: sleep schedules by age (newborn to 3 years), nap transitions, sleep regressions, bedtime routines, and gentle sleep training methods.',
  keywords: [
    'baby sleep schedule',
    'baby sleep schedule by age',
    'infant sleep schedule',
    'baby nap schedule',
    'bedtime routine baby',
    'sleep regression',
    'baby sleep training',
    'toddler sleep schedule',
    'newborn sleep schedule',
    'wake windows by age',
    'baby sleep tips',
  ],
  openGraph: {
    type: 'website',
    title: 'Baby Sleep Schedule & Tips by Age — Complete Guides',
    description:
      '65+ evidence-based baby sleep guides: schedules by age, nap transitions, regressions, bedtime routines, and gentle sleep training.',
    url: `${siteUrl}/blog`,
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  const blogLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LunaCradle Baby Sleep Blog',
    description:
      'Evidence-based articles on baby sleep, bedtime routines, sleep regressions, and more.',
    url: `${siteUrl}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'LunaCradle',
      url: siteUrl,
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      url: `${siteUrl}/blog/${post.slug}`,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogLd) }}
      />

      <section className="container mx-auto px-4 py-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="heading-underline">Baby Sleep Guides by Age</span>
          </h1>
          <p className="text-center text-slate-500 mb-6 max-w-2xl mx-auto">
            65+ evidence-based articles covering baby sleep schedules, nap transitions, sleep regressions, and gentle sleep training — from newborn to 3 years old.
          </p>
          <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto text-sm">
            Every guide references research from the AAP, NHS, and peer-reviewed pediatric sleep studies. Use the categories below to find exactly what you need.
          </p>
          <div className="mx-auto mb-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/blog/baby-sleep-schedule-by-age-complete-guide" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
              Sleep schedules by age
            </Link>
            <Link href="/blog/wake-windows-by-age-the-complete-guide" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
              Wake windows guide
            </Link>
            <Link href="/blog/baby-sleep-regression-what-to-expect-and-what-helps" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
              Sleep regressions
            </Link>
            <Link href="/free-schedule" className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-700 hover:bg-sky-100 text-center">
              Free schedule builder →
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-slate-400">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {posts.map((post, index) => (
              <AnimateOnScroll key={post.slug} delay={Math.min(index, 5) * 60}>
                <PostCard post={post} />
              </AnimateOnScroll>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
