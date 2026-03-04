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
  title: '2 Year Old Sleep Problems: Bedtime Battles, Nap Refusal, Night Waking',
  description:
    'Practical, gentle help for 2 year old sleep problems: bedtime resistance, nap refusal, split nights, and early waking, plus when to talk to your pediatrician.',
  path: '/toddler-sleep-2-year-old',
  keywords: [
    '2 year old sleep problems',
    'toddler bedtime battles',
    '2 year sleep regression',
    'toddler nap refusal',
    'toddler waking at night',
    '2 year old sleep schedule',
    'toddler sleep regression',
    'toddler won\'t stay in bed',
    'bedtime for 2 year old',
  ],
})

const tocItems = [
  { href: '#causes', label: 'Common causes' },
  { href: '#triage', label: 'Quick triage checklist' },
  { href: '#fixes', label: 'Fixes that usually work' },
  { href: '#naps', label: 'If naps are falling apart' },
  { href: '#when-doctor', label: 'When to talk to a doctor' },
  { href: '#faq', label: 'FAQ' },
]

const faqItems: FaqItem[] = [
  {
    question: 'How long does the 2 year sleep regression last?',
    answer:
      'Many families notice improvement over 2-6 weeks with a consistent routine and clear boundaries, but timelines vary by child.',
  },
  {
    question: 'What are split nights in toddlers?',
    answer:
      'Split nights are long wake periods in the middle of the night. They can be linked to schedule mismatch, too much daytime sleep, or inconsistent bedtime patterns.',
  },
  {
    question: 'How can I reduce early waking in a 2 year old?',
    answer:
      'Review nap timing, bedtime timing, and early morning light. Keep wake-up responses calm and consistent while adjusting schedule gradually.',
  },
  {
    question: 'What if my toddler refuses bedtime every night?',
    answer:
      'Use a predictable routine, simple limits, and one clear response plan for stalling behaviors. Consistency matters more than intensity.',
  },
  {
    question: 'Should my 2 year old drop naps?',
    answer:
      'Most still need a nap. Before dropping it, test nap timing and duration adjustments plus an earlier bedtime on rough days.',
  },
  {
    question: 'Are nightmares and night terrors the same?',
    answer:
      'No. Nightmares usually happen later in the night and children may seek comfort. Night terrors often happen earlier and children may seem confused or unaware. Persistent concerns should be discussed with your pediatrician.',
  },
  {
    question: 'Can separation anxiety affect sleep at this age?',
    answer:
      'Yes. Separation anxiety can increase bedtime protest and night waking. Connection plus firm, calm limits usually helps.',
  },
  {
    question: 'Do I need strict sleep training for a toddler?',
    answer:
      'Not necessarily. Many families improve sleep with gentle structure, routine consistency, and a clear bedtime response plan.',
  },
  {
    question: 'What if my toddler wakes and wants to play at night?',
    answer:
      'Keep interactions boring and brief, reduce stimulation, and return to the same response each time. Daytime schedule balance is also important.',
  },
]

const faqJsonLd = faqToJsonLd(faqItems)

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '2 year old sleep problems: bedtime battles, nap refusal, night waking',
  description: metadata.description,
  url: `${siteUrl}/toddler-sleep-2-year-old`,
}

export default function ToddlerSleepTwoYearOldPage() {
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
            Toddler sleep guide
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            2 year old sleep problems: bedtime battles, nap refusal, night waking
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
            Toddler sleep can change quickly around age two. Development, boundaries, and schedule shifts all collide at bedtime.
            A calm, structured plan usually helps.
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
              <Link href="#fixes">See how it works</Link>
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

        <section id="causes" className="pb-10">
          <h2 className="text-2xl font-bold">Common causes at age 2</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
            <li>Developmental leaps and a stronger drive for independence.</li>
            <li>Separation anxiety around bedtime or overnight wakings.</li>
            <li>Boundary testing and stalling behaviors at lights-out.</li>
            <li>Nap transitions or schedule mismatch.</li>
            <li>Overtiredness from inconsistent routines.</li>
          </ul>
        </section>

        <section id="triage" className="pb-10">
          <h2 className="text-2xl font-bold">Quick triage checklist</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
              <h3 className="font-semibold">Nap length and timing</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Too-late naps can push bedtime battles and split nights.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
              <h3 className="font-semibold">Bedtime timing</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Too-late bedtime can increase overtiredness and early waking.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
              <h3 className="font-semibold">Routine consistency</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">A predictable sequence helps toddlers cooperate and settle faster.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
              <h3 className="font-semibold">Night fears or stress</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use reassurance plus clear boundaries, not high-stimulation responses.</p>
            </article>
          </div>
        </section>

        <section id="fixes" className="pb-10">
          <h2 className="text-2xl font-bold">Fixes that usually work</h2>
          <ol className="mt-4 space-y-3 pl-5 text-slate-700 dark:text-slate-200">
            <li>
              <span className="font-semibold">Lock in a bedtime routine.</span> Keep steps short, predictable, and calm.
            </li>
            <li>
              <span className="font-semibold">Set one response plan for protests.</span> Use the same calm wording and return pattern each night.
            </li>
            <li>
              <span className="font-semibold">Adjust nap timing before dropping naps.</span> Small schedule changes often work better than full removal.
            </li>
            <li>
              <span className="font-semibold">Reduce stimulation after bedtime.</span> Keep lights low, voice soft, and interactions brief overnight.
            </li>
            <li>
              <span className="font-semibold">Track 5-7 days before reworking the plan.</span> Patterns are easier to see over a full week.
            </li>
          </ol>
        </section>

        <section className="pb-10">
          <CtaCard
            title="Build a toddler-friendly plan"
            description="Create a plan matched to your toddler's temperament, schedule, and your parenting style."
            primaryLabel="Build a toddler-friendly plan"
            secondaryHref="#faq"
          />
        </section>

        <section id="naps" className="pb-10">
          <h2 className="text-2xl font-bold">If naps are falling apart</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
            <li>Try quiet time even if sleep does not happen every day.</li>
            <li>Move nap earlier if bedtime is drifting too late.</li>
            <li>Use a nap cutoff to protect nighttime sleep.</li>
            <li>On no-nap days, shift bedtime earlier.</li>
          </ul>
        </section>

        <section id="when-doctor" className="pb-10">
          <h2 className="text-2xl font-bold">When to talk to a doctor</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Check with your pediatrician for breathing concerns, frequent severe distress, persistent snoring, pain signs, feeding issues, or developmental concerns.
            Review our{' '}
            <Link href={MARKETING_LINKS.redFlags} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
              red flags guidance
            </Link>{' '}
            for a quick safety list.
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
                Baby and toddler sleep blog
              </Link>
            </li>
            <li>
              <Link
                href="/blog/baby-waking-at-5am-early-morning-fixes-that-work"
                className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
              >
                Early morning waking fixes
              </Link>
            </li>
            <li>
              <Link
                href="/blog/perfect-bedtime-routine-by-age"
                className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
              >
                Bedtime routine by age
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
            title="Ready to make bedtime easier?"
            description="Start with a practical plan and adjust weekly using your sleep diary."
            secondaryHref={MARKETING_LINKS.howItWorks}
            secondaryLabel="See how it works"
          />
        </section>

        <section className="pb-16">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This page is educational and not medical advice. If you are concerned about your child&apos;s health or safety, contact your pediatrician.
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last updated: {MARKETING_LAST_UPDATED}</p>
        </section>
      </main>
    </div>
  )
}
