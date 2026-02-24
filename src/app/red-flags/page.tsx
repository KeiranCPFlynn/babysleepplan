import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingHeader } from '@/components/layout/marketing-header'
import { MARKETING_LINKS, MARKETING_PRIMARY_CTA_HREF, MARKETING_PRIMARY_CTA_LABEL } from '@/lib/marketing'
import { buildMarketingMetadata } from '@/lib/seo'

export const metadata: Metadata = buildMarketingMetadata({
  title: 'Baby and Toddler Sleep Red Flags: When to Call Your Pediatrician',
  description:
    'Quick safety guidance for sleep-related red flags in babies and toddlers, and when to seek medical care.',
  path: '/red-flags',
  keywords: [
    'baby sleep red flags',
    'toddler sleep warning signs',
    'when to call pediatrician for sleep',
  ],
})

export default function RedFlagsPage() {
  return (
    <div className="marketing-shell min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 pb-20 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <MarketingHeader
        links={[
          { href: MARKETING_LINKS.howItWorks, label: 'How It Works' },
          { href: MARKETING_LINKS.blog, label: 'Blog' },
          { href: MARKETING_LINKS.science, label: 'Science' },
        ]}
        loginHref="/login"
        ctaHref={MARKETING_PRIMARY_CTA_HREF}
        ctaLabel={MARKETING_PRIMARY_CTA_LABEL}
      />

      <main className="container mx-auto max-w-4xl px-4 pt-8">
        <h1 className="text-3xl font-bold sm:text-4xl">Sleep red flags: when to talk to your pediatrician</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          This page is educational only and does not replace medical care. If you are worried, trust your instincts and contact your pediatrician.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5">
          <h2 className="text-xl font-semibold">Call your pediatrician for:</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
            <li>Breathing pauses, labored breathing, or persistent loud snoring during sleep.</li>
            <li>Fever, vomiting, dehydration signs, or persistent pain-related crying.</li>
            <li>Poor feeding, weight concerns, or sudden behavior changes.</li>
            <li>No meaningful sleep improvement despite consistent routine support over time.</li>
          </ul>
        </section>

        <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
          For general support, visit the{' '}
          <Link href={MARKETING_LINKS.blog} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
            LunaCradle blog
          </Link>{' '}
          or see{' '}
          <Link href={MARKETING_LINKS.howItWorks} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
            how it works
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
