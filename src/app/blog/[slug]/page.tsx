import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts, getPostBySlug, getPostSlugs } from '@/lib/blog'
import { PostContent } from '@/components/blog/post-content'
import { PostCard } from '@/components/blog/post-card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { formatUniversalDate } from '@/lib/date-format'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const slugs = getPostSlugs()
  if (!slugs.includes(slug)) return {}

  const post = getPostBySlug(slug)

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.dateModified || post.date,
      images: [{ url: post.image, width: 1200, height: 630, alt: post.imageAlt }],
      url: `${siteUrl}/blog/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
    alternates: {
      canonical: `${siteUrl}/blog/${slug}`,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const slugs = getPostSlugs()
  if (!slugs.includes(slug)) notFound()

  const post = getPostBySlug(slug)

  // Related posts: share at least one tag
  const allPosts = getAllPosts()
  const related = allPosts
    .filter(
      (p) =>
        p.slug !== slug && p.tags.some((t) => post.tags.includes(t))
    )
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    dateModified: post.dateModified || post.date,
    wordCount: post.wordCount,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LunaCradle',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${slug}`,
    },
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Hero image */}
        <AnimateOnScroll>
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-lg mb-8">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 720px"
            />
          </div>
        </AnimateOnScroll>

        {/* Post header */}
        <AnimateOnScroll delay={100}>
          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
              <time dateTime={post.date}>
                {formatUniversalDate(post.date)}
              </time>
              <span>&middot;</span>
              <span>{post.author}</span>
              <span>&middot;</span>
              <span>{post.readingTime} min read</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-sky-50 border border-sky-200 px-3 py-0.5 text-xs font-medium text-sky-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>
        </AnimateOnScroll>

        {/* Body */}
        <AnimateOnScroll delay={200}>
          <PostContent content={post.content} />
        </AnimateOnScroll>

        {/* Unsplash attribution */}
        {post.imageCredit && post.imageCreditUrl ? (
          <p className="mt-10 text-xs text-slate-400">
            Photo by{' '}
            <a
              href={`${post.imageCreditUrl}?utm_source=lunacradle&utm_medium=referral`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              {post.imageCredit}
            </a>
            {' '}on{' '}
            <a
              href="https://unsplash.com?utm_source=lunacradle&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              Unsplash
            </a>
          </p>
        ) : post.image.includes('unsplash.com') ? (
          <p className="mt-10 text-xs text-slate-400">
            Photo via{' '}
            <a
              href="https://unsplash.com?utm_source=lunacradle&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              Unsplash
            </a>
          </p>
        ) : null}

        {/* CTA */}
        <AnimateOnScroll>
          <div className="mt-12 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Ready for better sleep?
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Get a personalized, evidence-based sleep plan tailored to your
              baby&apos;s age and your family&apos;s needs.
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              Get Your Sleep Plan
            </Link>
          </div>
        </AnimateOnScroll>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="container mx-auto px-4 pb-16 max-w-6xl">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Related Articles
            </h2>
          </AnimateOnScroll>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {related.map((relPost, i) => (
              <AnimateOnScroll key={relPost.slug} delay={i * 150}>
                <PostCard post={relPost} />
              </AnimateOnScroll>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
