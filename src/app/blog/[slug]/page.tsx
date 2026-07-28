import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPosts, getPostBySlug, getPostSlugs } from '@/lib/blog'
import { PostContent } from '@/components/blog/post-content'
import { PostCard } from '@/components/blog/post-card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { formatUniversalDate } from '@/lib/date-format'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

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
    keywords: post.tags,
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

  const howToLd = post.howTo
    ? {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: post.howTo.name,
      step: post.howTo.steps.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: step.name,
        text: step.text,
      })),
    }
    : null

  const faqLd =
    post.faq.length > 0
      ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
      : null

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
      {howToLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }}
        />
      )}
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <article className="container mx-auto px-4 py-12 pb-24 md:pb-12 max-w-3xl">
        {/* Hero image */}
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

        {/* Post header */}
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

        {/* Top CTA */}
        <div className="mb-10 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800">Get your baby&apos;s personalized sleep schedule</p>
            <p className="text-xs text-slate-500 mt-0.5">Free builder — no account needed</p>
          </div>
          <Link
            href="/free-schedule"
            className="shrink-0 inline-block rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
          >
            Try Free
          </Link>
        </div>

        {/* Body */}
        <PostContent content={post.content} />

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

        {/* FAQ section */}
        {post.faq.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {post.faq.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-slate-200 bg-white shadow-sm open:shadow-md transition-shadow"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 text-base font-semibold text-slate-800 flex items-center justify-between gap-3">
                    {item.question}
                    <svg
                      className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-slate-600 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <AnimateOnScroll>
          <div className="mt-14 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 p-8 text-center shadow-lg shadow-sky-200/50 dark:shadow-none">
            <h2 className="text-xl font-bold text-white mb-2">
              Ready for better nights?
            </h2>
            <p className="text-sky-100 mb-5 max-w-md mx-auto text-sm">
              Get a personalized schedule in seconds — or a full adaptive plan that learns from your baby&apos;s sleep patterns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/free-schedule"
                className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 transition-colors"
              >
                Free Schedule Builder
              </Link>
              <Link
                href="/signup"
                className="inline-block rounded-full border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Full Plan — 5 Days Free
              </Link>
            </div>
          </div>
        </AnimateOnScroll>
      </article>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-sky-200/80 bg-white/95 px-3 py-2.5 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Free sleep schedule builder</p>
            <p className="text-xs text-slate-500">Personalized for your baby — no account needed</p>
          </div>
          <Link
            href="/free-schedule"
            className="shrink-0 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
          >
            Try Free
          </Link>
        </div>
      </div>

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
              <AnimateOnScroll key={relPost.slug} delay={i * 80}>
                <PostCard post={relPost} />
              </AnimateOnScroll>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
