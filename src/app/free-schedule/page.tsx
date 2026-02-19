import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { FreeScheduleClient } from './free-schedule-client'
import { MarketingHeader } from '@/components/layout/marketing-header'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: 'Free Baby Sleep Schedule Builder | LunaCradle',
  description:
    "Paste your baby's sleep situation or chat — get a free, age-specific schedule in seconds. No account needed.",
  keywords: [
    'free baby sleep schedule',
    'baby sleep schedule builder',
    'baby sleep schedule generator',
    'free baby schedule',
    'baby sleep help',
  ],
  alternates: { canonical: `${siteUrl}/free-schedule` },
  openGraph: {
    title: 'Free Baby Sleep Schedule Builder | LunaCradle',
    description:
      "Paste your baby's sleep situation or chat — get a free, age-specific schedule in seconds.",
    url: `${siteUrl}/free-schedule`,
  },
}

export default async function FreeSchedulePage() {
  const showAdminSocialTools = process.env.NODE_ENV !== 'production'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />

      {/* Nav */}
      <MarketingHeader
        links={[
          { href: '/how-it-works', label: 'How It Works' },
          { href: '/science', label: 'Science' },
          { href: '/blog', label: 'Blog' },
          { href: '/free-schedule', label: 'Free Schedule' },
        ]}
        loginHref="/login"
        ctaHref="/signup"
        ctaLabel="Get full plan"
        mobileCtaLabel="Get plan"
        activeHref="/free-schedule"
      />

      {/* Main content */}
      <main className="container mx-auto px-4 pb-16 max-w-2xl">
        {/* Hero */}
        <div className="text-center mb-8 pt-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 mb-4">
            Free — no account needed
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">
            Free Baby Sleep Schedule Builder
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Paste a post or describe your situation. We&apos;ll create an age-specific schedule with
            guidance tailored to your baby — no signup required.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-8">
          <span className="flex items-center gap-1">
            <span className="text-sky-600">✓</span> Evidence-based
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-600">✓</span> Ages 0–5 years
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-600">✓</span> PDF emailed free
          </span>
          <span className="flex items-center gap-1">
            <span className="text-sky-600">✓</span> No account needed
          </span>
        </div>

        {/* Chat UI */}
        <FreeScheduleClient showAdminSocialTools={showAdminSocialTools} />

        {/* Footer CTA */}
        <div className="text-center mt-10 text-sm text-slate-500 dark:text-slate-400">
          <p>
            Want weekly updates as your baby grows?{' '}
            <Link href="/signup" className="text-sky-700 underline underline-offset-2 hover:text-sky-900 dark:text-sky-400">
              Start a full personalised plan
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800 py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} LunaCradle · Not medical advice</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>
            <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
