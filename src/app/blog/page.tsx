import type { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { PostCard } from '@/components/blog/post-card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: 'Baby Sleep Blog — Evidence-Based Tips & Guides | LunaCradle',
  description:
    'Evidence-based articles on baby sleep, bedtime routines, sleep regressions, and more. Written by the LunaCradle team.',
  keywords: [
    'baby sleep tips',
    'infant sleep schedule',
    'bedtime routine',
    'sleep regression',
    'baby sleep training',
    'toddler sleep',
    'newborn sleep',
  ],
  openGraph: {
    type: 'website',
    title: 'Baby Sleep Blog — Evidence-Based Tips & Guides',
    description:
      'Evidence-based articles on baby sleep, bedtime routines, sleep regressions, and more.',
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
        <AnimateOnScroll>
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <span className="heading-underline">Baby Sleep Blog</span>
          </h1>
          <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">
            Research-backed articles to help your family sleep better.
          </p>
        </AnimateOnScroll>

        {posts.length === 0 ? (
          <p className="text-center text-slate-400">No posts yet. Check back soon!</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {posts.map((post, index) => (
              <AnimateOnScroll key={post.slug} delay={index * 150}>
                <PostCard post={post} />
              </AnimateOnScroll>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
