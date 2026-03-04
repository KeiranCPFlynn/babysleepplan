import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/layout/marketing-header'
import { CtaCard } from '@/components/marketing/CtaCard'
import { Faq, faqToJsonLd, type FaqItem } from '@/components/marketing/Faq'
import { TrustBar } from '@/components/marketing/TrustBar'
import {
  MARKETING_LAST_UPDATED,
  MARKETING_LINKS,
  MARKETING_PRIMARY_CTA_HREF,
  MARKETING_PRIMARY_CTA_LABEL,
} from '@/lib/marketing'
import { buildMarketingMetadata } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export const metadata: Metadata = buildMarketingMetadata({
  title: '4 Month Sleep Regression: What Is Happening and What Helps Tonight',
  description:
    'A practical, evidence-based guide to the 4 month sleep regression: signs, duration, what to do tonight, common mistakes, and when to call your pediatrician.',
  path: '/4-month-sleep-regression',
  keywords: [
    '4 month sleep regression',
    'baby waking every 2 hours',
    'sleep regression signs',
    '4 month old sleep help',
    'what to do during sleep regression',
    'sleep regression how long',
    '4 month old sleep schedule',
    'baby sleep regression ages',
  ],
})

const tocItems = [
  { href: '#whats-happening', label: 'What is happening' },
  { href: '#signs', label: 'Signs you are in it' },
  { href: '#how-long', label: 'How long it lasts' },
  { href: '#how-it-works', label: 'What helps tonight' },
  { href: '#what-not-to-do', label: 'What not to do' },
  { href: '#when-doctor', label: 'When to talk to a doctor' },
  { href: '#faq', label: 'FAQ' },
]

const faqItems: FaqItem[] = [
  {
    question: 'Why is my baby waking every 2 hours at 4 months?',
    answer:
      'Around this age, sleep cycles mature and babies spend more time in lighter sleep. They may wake more often between cycles, especially if overtired or relying on strong sleep associations.',
  },
  {
    question: 'Should I drop a nap during the 4 month regression?',
    answer:
      'Usually not immediately. Most babies still need multiple naps at this age. Focus on regular wake windows and bedtime consistency first.',
  },
  {
    question: 'Do I need to sleep train right away?',
    answer:
      'Not always. Many families start with routine, timing, and gentle settling adjustments. Structured sleep training is optional and should match your comfort level.',
  },
  {
    question: 'How can I handle early morning waking?',
    answer:
      'Check bedtime timing, daytime sleep balance, and morning light exposure. Keep responses calm and consistent while avoiding a large schedule shift overnight.',
  },
  {
    question: 'How do I tell regression vs illness?',
    answer:
      'Regression is usually pattern-based and developmental. Fever, persistent discomfort, breathing concerns, or poor feeding suggest checking with your pediatrician.',
  },
  {
    question: 'Does every baby go through a 4 month regression?',
    answer:
      'Not every baby shows it the same way. Some have clear disruptions, while others only show mild changes for a short period.',
  },
  {
    question: 'Can feeding changes help nighttime wake-ups?',
    answer:
      'Sometimes. Keeping feeds predictable and making sure daytime intake is strong can help, but feeding concerns should always be discussed with your pediatrician.',
  },
  {
    question: 'How long before we see improvement?',
    answer:
      'Many families see progress over one to three weeks with consistent routines, daytime balance, and age-appropriate settling support.',
  },
  {
    question: 'Do I need perfect tracking to improve sleep?',
    answer:
      'No. Simple daily logs of bedtime, wake time, naps, and wakings are usually enough to identify useful patterns.',
  },
]

const faqJsonLd = faqToJsonLd(faqItems)

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '4 month sleep regression: what is happening and what to do tonight',
  description: metadata.description,
  url: `${siteUrl}/4-month-sleep-regression`,
}

export default function FourMonthSleepRegressionPage() {
  return (
    <div className="marketing-shell min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 pb-20 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <MarketingHeader
        links={[
          { href: MARKETING_LINKS.howItWorks, label: 'How It Works' },
          { href: MARKETING_LINKS.science, label: 'Science' },
          { href: MARKETING_LINKS.blog, label: 'Blog' },
        ]}
        loginHref="/login"
        ctaHref={MARKETING_PRIMARY_CTA_HREF}
        ctaLabel={MARKETING_PRIMARY_CTA_LABEL}
      />

      <main className="container mx-auto max-w-5xl px-4">
        <section className="pt-8 pb-10">
          <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 dark:border-sky-700/60 dark:bg-sky-900/30 px-3 py-1 text-sm font-medium text-sky-700 dark:text-sky-300">
            Parent guide
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            4 month sleep regression: what&apos;s happening and what to do tonight
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
            This stage is hard, but it is common. Your baby&apos;s sleep cycles are maturing, which can lead to more frequent waking.
            A steady plan can make nights feel manageable again.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
              <Link href={MARKETING_PRIMARY_CTA_HREF}>{MARKETING_PRIMARY_CTA_LABEL}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800"
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
          <TrustBar className="mt-5" />
        </section>

        <section className="pb-10">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5">
            <h2 className="text-lg font-semibold">On this page</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {tocItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="whats-happening" className="pb-10">
          <h2 className="text-2xl font-bold">What&apos;s happening at 4 months</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Around 3-5 months, sleep architecture becomes more adult-like. Instead of long stretches of newborn-style sleep,
            babies cycle through lighter and deeper phases more clearly. That can mean more night wake-ups between cycles.
          </p>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            This is developmental, not a failure. The goal is to support your baby with predictable rhythms and settling routines.
          </p>
        </section>

        <section id="signs" className="pb-10">
          <h2 className="text-2xl font-bold">Signs you&apos;re in it</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
            <li>Night waking increases even after a previously better stretch.</li>
            <li>Naps become shorter or harder to extend.</li>
            <li>Bedtime takes longer than usual.</li>
            <li>Early morning waking becomes more common.</li>
            <li>Sleep feels unpredictable from one day to the next.</li>
          </ul>
        </section>

        <section id="how-long" className="pb-10">
          <h2 className="text-2xl font-bold">How long it lasts</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Many babies settle over 2-6 weeks, but timing varies. Some improve quickly with routine changes; others need a longer period of steady support.
            There is no exact timeline for every baby.
          </p>
        </section>

        <section id="how-it-works" className="pb-10">
          <h2 className="text-2xl font-bold">What helps: a simple tonight plan</h2>
          <ol className="mt-4 space-y-3 pl-5 text-slate-700 dark:text-slate-200">
            <li>
              <span className="font-semibold">Protect bedtime routine.</span> Keep the same calming steps and timing each night.
            </li>
            <li>
              <span className="font-semibold">Stabilize wake windows.</span> Aim for age-appropriate daytime spacing to reduce overtiredness.
            </li>
            <li>
              <span className="font-semibold">Avoid the overtired spiral.</span> If naps are short, consider an earlier bedtime.
            </li>
            <li>
              <span className="font-semibold">Use feeding and comfort thoughtfully.</span> Keep feeds and soothing responsive and consistent without rapid daily shifts.
            </li>
            <li>
              <span className="font-semibold">Choose gentle settling options.</span> Start with your preferred level of support and maintain it for several nights before changing strategy.
            </li>
          </ol>
        </section>

        <section className="pb-10">
          <CtaCard
            title="Get a plan that adapts weekly based on your diary"
            description="LunaCradle helps you turn daily logs into practical next steps, not generic advice."
            secondaryHref="#faq"
          />
        </section>

        <section id="what-not-to-do" className="pb-10">
          <h2 className="text-2xl font-bold">What not to do</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
            <li>Changing strategy every night before giving it time to work.</li>
            <li>Letting bedtime drift too late after a rough nap day.</li>
            <li>Dropping naps too early without clear readiness signs.</li>
            <li>Assuming every wake is behavioral when illness may be present.</li>
          </ul>
        </section>

        <section id="when-doctor" className="pb-10">
          <h2 className="text-2xl font-bold">When to talk to a doctor</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Contact your pediatrician for breathing concerns, persistent pain signs, poor feeding, fever, weight concerns, or worsening sleep with no improvement over time.
            You can also review our{' '}
            <Link href={MARKETING_LINKS.redFlags} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
              red flags guidance
            </Link>
            .
          </p>
        </section>

        <section id="faq" className="pb-12">
          <Faq items={faqItems} />
        </section>

        <section id="related-reading" className="pb-10">
          <h2 className="text-2xl font-bold">Related reading</h2>
          <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-200">
            <li>
              <Link href={MARKETING_LINKS.blog} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                Baby sleep blog
              </Link>
            </li>
            <li>
              <Link
                href="/blog/baby-sleep-regression-what-to-expect-and-what-helps"
                className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
              >
                Baby sleep regression: what to expect and what helps
              </Link>
            </li>
            <li>
              <Link
                href="/blog/wake-windows-by-age-the-complete-guide"
                className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
              >
                Wake windows by age: complete guide
              </Link>
            </li>
            <li>
              <Link href={MARKETING_LINKS.pricing} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                Pricing and current offers
              </Link>
            </li>
          </ul>
        </section>

        <section className="pb-10">
          <CtaCard
            title="Ready for a calmer bedtime?"
            description="Build a plan matched to your baby, your routine, and your comfort level."
            secondaryHref={MARKETING_LINKS.howItWorks}
            secondaryLabel="See how it works"
          />
        </section>

        <section className="pb-16">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This page is educational and not medical advice. For concerns about health, feeding, breathing, pain, or growth, consult your pediatrician.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last updated: {MARKETING_LAST_UPDATED}</p>
        </section>
      </main>
    </div>
  )
}
