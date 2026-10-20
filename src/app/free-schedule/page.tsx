import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { FreeScheduleClient } from './free-schedule-client'
import { MarketingHeader } from '@/components/layout/marketing-header'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'Free Baby Sleep Schedule Builder',
  description:
    "Describe your baby's age and routine to create a free sleep schedule preview. No account or email needed to preview; email unlocks the full guidance and PDF.",
  keywords: [
    'free baby sleep schedule',
    'baby sleep schedule builder',
    'baby sleep schedule generator',
    'free baby schedule',
    'baby sleep help',
    'baby nap schedule',
    'nap schedule by age',
    'baby sleep schedule sample',
  ],
  alternates: { canonical: `${siteUrl}/free-schedule` },
  openGraph: {
    title: 'Free Baby Sleep Schedule Builder | LunaCradle',
    description:
      "Create a free sleep schedule preview from your baby's age and routine. See nap times and bedtime without an account or email.",
    url: `${siteUrl}/free-schedule`,
  },
}

export default async function FreeSchedulePage() {
  const showAdminSocialTools = process.env.NODE_ENV !== 'production'
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null

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
        <div className="text-center mb-6 pt-4">
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 mb-4">
            Free — no account needed
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">
            Free Baby Sleep Schedule Builder
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Tell us your baby&apos;s age, morning wake time and sleep challenge.
            Get a daily timetable with nap times, bedtime and two guidance tips.
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Preview without an account or email. Choose to email the PDF to unlock
            the full guidance and adjustments, plus occasional sleep tips.
          </p>
        </div>

        {/* Chat UI */}
        <FreeScheduleClient
          showAdminSocialTools={showAdminSocialTools}
          turnstileSiteKey={turnstileSiteKey}
        />

        <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
          <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200">
            What will my preview look like?
          </summary>
          <div className="mt-4 space-y-3 text-slate-600 dark:text-slate-400">
            <p>You&apos;ll see a timetable with exact times and activities, followed by two guidance tips.</p>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="font-medium text-slate-700 dark:text-slate-200">Example input</p>
              <p className="mt-1">&ldquo;My baby is 8 months, wakes at 7am and takes two short naps. Bedtime is 7pm.&rdquo;</p>
              <p className="mt-3 font-medium text-slate-700 dark:text-slate-200">Your preview includes</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>A morning wake time, suggested nap times and bedtime</li>
                <li>Two tips related to the sleep challenge you described</li>
              </ul>
            </div>
            <p>This example shows what to enter, not a recommended routine. Your draft uses the details you share. You can leave out names and other identifying information.</p>
            <p>General information, not medical advice. For health or development concerns, speak to your child&apos;s clinician.</p>
          </div>
        </details>

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
