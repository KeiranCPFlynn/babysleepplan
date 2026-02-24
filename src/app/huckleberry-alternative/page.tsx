import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/layout/marketing-header'
import { CtaCard } from '@/components/marketing/CtaCard'
import { ComparisonTable, type ComparisonRow } from '@/components/marketing/ComparisonTable'
import { Faq, faqToJsonLd, type FaqItem } from '@/components/marketing/Faq'
import { TrustBar } from '@/components/marketing/TrustBar'
import {
  MARKETING_LAST_UPDATED,
  MARKETING_LINKS,
  MARKETING_PRIMARY_CTA_HREF,
  MARKETING_PRIMARY_CTA_LABEL,
  MARKETING_PRICING_LINES,
} from '@/lib/marketing'
import { buildMarketingMetadata } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()
const gbpToUsdRate = 1.365
const huckleberryPremiumMonthlyGbp = 12.99
const huckleberryPlusMonthlyGbp = 10.99
const huckleberryPremiumMonthlyUsd = huckleberryPremiumMonthlyGbp * gbpToUsdRate
const huckleberryPlusMonthlyUsd = huckleberryPlusMonthlyGbp * gbpToUsdRate
const huckleberryPremiumThreeMonthUsd = huckleberryPremiumMonthlyUsd * 3

export const metadata: Metadata = buildMarketingMetadata({
  title: 'Huckleberry Alternative: Personalized Sleep Plans That Keep Adapting',
  description:
    'Looking for a Huckleberry alternative? Compare LunaCradle vs Huckleberry and see how diary-based weekly updates can support babies and toddlers ages 0-5.',
  path: '/huckleberry-alternative',
  keywords: [
    'huckleberry alternative',
    'baby sleep app alternative',
    'personalized baby sleep plan',
    'toddler sleep help',
    'sleep diary app for babies',
  ],
})

const comparisonRows: ComparisonRow[] = [
  { feature: 'Personalized sleep plan', lunaCradle: 'Yes', competitor: 'Yes' },
  { feature: 'Diary-based adaptive updates', lunaCradle: 'Yes', competitor: 'No' },
  { feature: 'Weekly review based on logs', lunaCradle: 'Yes', competitor: 'Limited' },
  { feature: 'Works for toddlers (2-3+)', lunaCradle: 'Yes', competitor: 'Unknown' },
  { feature: 'Platform', lunaCradle: 'Web (mobile-friendly)', competitor: 'iOS / Android' },
  {
    feature: 'Pricing (sleep-plan tier)',
    lunaCradle: '$19/month standard; $9.50/month for your first 3 months with 50% off',
    competitor: `Premium £12.99/month (monthly), about $${huckleberryPremiumMonthlyUsd.toFixed(2)} at current FX`,
  },
  {
    feature: 'Other paid tier',
    lunaCradle: 'Single plan with adaptive weekly updates included',
    competitor: `Plus £10.99/month (about $${huckleberryPlusMonthlyUsd.toFixed(2)} at current FX)`,
  },
  {
    feature: 'Cost to start',
    lunaCradle: '$9.50 first month with current 50% offer',
    competitor: `£12.99 (~$${huckleberryPremiumMonthlyUsd.toFixed(2)}) first month`,
  },
  {
    feature: 'First 3 months total (monthly pricing)',
    lunaCradle: '$28.50 total with current 50% offer',
    competitor: `£38.97 (~$${huckleberryPremiumThreeMonthUsd.toFixed(2)}) total`,
  },
]

const scenarios = [
  {
    title: 'Frequent night wakings',
    text: 'Map your wakings by time and context, then adjust bedtime, response steps, and overnight strategy each week.',
  },
  {
    title: 'Short naps',
    text: 'Use nap logs to spot overtired windows and tune schedule timing in smaller, practical increments.',
  },
  {
    title: 'Early morning waking',
    text: 'Review bedtime load, wake windows, and morning light cues to shift wake time gradually.',
  },
  {
    title: 'Bedtime battles',
    text: 'Create a predictable bedtime routine with clear steps and age-appropriate boundaries.',
  },
  {
    title: 'Regressions',
    text: 'Keep a stable core plan while adapting for developmental jumps, travel, or illness recovery.',
  },
]

const faqItems: FaqItem[] = [
  {
    question: 'Is this sleep training?',
    answer:
      'It can include sleep training techniques, but it does not have to. Plans can be gentle, gradual, or more structured based on your preferences.',
  },
  {
    question: 'Will it work for toddlers?',
    answer:
      'Yes. LunaCradle is designed for ages 0-5, including common toddler challenges like bedtime resistance and nap transitions.',
  },
  {
    question: 'What if I prefer gentle methods?',
    answer:
      'You can prioritize responsive, lower-cry approaches. The plan follows your comfort level and updates from your diary data.',
  },
  {
    question: 'How fast do I get a plan?',
    answer: 'Most families receive a personalized plan within minutes after completing intake.',
  },
  {
    question: 'Do I need perfect tracking?',
    answer:
      'No. Consistent, good-enough logs are usually enough to find patterns and improve recommendations.',
  },
  {
    question: 'What is the difference vs a static PDF plan?',
    answer:
      'A static plan is fixed. LunaCradle uses your diary to update guidance weekly as sleep patterns change.',
  },
  {
    question: 'Who should pick Huckleberry instead?',
    answer:
      'If you strongly prefer app-native iOS/Android workflows first, that may fit better. If you want ongoing diary-to-plan updates, LunaCradle may be a better fit.',
  },
  {
    question: 'Is this medical advice?',
    answer:
      'No. LunaCradle is educational sleep guidance and does not replace care from your pediatrician or clinician.',
  },
]

const webPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'A Huckleberry alternative that adapts as your baby changes',
  description: metadata.description,
  url: `${siteUrl}/huckleberry-alternative`,
}

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'LunaCradle vs Huckleberry comparison points',
  itemListElement: comparisonRows.map((row, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: row.feature,
  })),
}

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'LunaCradle',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'USD',
    description: MARKETING_PRICING_LINES.join('. '),
  },
  url: siteUrl,
}

const faqJsonLd = faqToJsonLd(faqItems)

export default function HuckleberryAlternativePage() {
  return (
    <div className="marketing-shell min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 pb-20 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
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
        <section className="pt-8 pb-12">
          <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 dark:border-sky-700/60 dark:bg-sky-900/30 px-3 py-1 text-sm font-medium text-sky-700 dark:text-sky-300">
            Comparison guide
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            A Huckleberry alternative that adapts as your baby changes
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 dark:text-slate-300">
            If you want a personalized plan that updates from your real sleep logs each week, this comparison is for you.
            LunaCradle supports infants and toddlers ages 0-5 with a calm, practical approach.
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

        <section id="who-its-for" className="pb-10">
          <h2 className="text-2xl font-bold">Who this is for</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Parents who want support beyond generic wake-window advice. If you have night wakings, short naps, early wakes,
            or bedtime struggles, a diary-driven plan can help you adjust without guessing.
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Looking for pricing details first? Visit{' '}
            <Link href={MARKETING_LINKS.pricing} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
              pricing and current offers
            </Link>
            .
          </p>
        </section>

        <section id="comparison" className="pb-12">
          <h2 className="text-2xl font-bold">LunaCradle vs Huckleberry</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            This comparison is factual and high-level. Huckleberry details can vary by plan and region.
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Huckleberry pricing reference used for this comparison: Premium monthly £12.99 and Plus monthly £10.99.
            FX conversion uses 1 GBP = 1.365 USD (checked February 24, 2026). Sources:{' '}
            <a
              href="https://huckleberrycare.com/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
            >
              huckleberrycare.com/pricing
            </a>{' '}
            and{' '}
            <a
              href="https://www.xe.com/en-us/currencytables/?from=GBP"
              target="_blank"
              rel="noreferrer"
              className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
            >
              xe.com GBP tables
            </a>
            .
          </p>
          <div className="mt-5">
            <ComparisonTable competitorLabel="Huckleberry" rows={comparisonRows} />
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            For families comparing monthly plans, LunaCradle is lower to start ($9.50 vs about $
            {huckleberryPremiumMonthlyUsd.toFixed(2)}) and lower across the first 3 months ($28.50 vs about $
            {huckleberryPremiumThreeMonthUsd.toFixed(2)}). Beyond price, LunaCradle&apos;s weekly diary-based plan updates
            are built for ongoing adaptation as sleep changes.
          </p>
        </section>

        <section id="how-it-works" className="grid gap-6 pb-12 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5">
            <h2 className="text-2xl font-bold">Key differences</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              LunaCradle is built around a diary-to-insight-to-update loop. You log sleep, the system finds patterns,
              and your plan gets refreshed with clear next steps.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-700 dark:text-slate-200">
              <li>Track daily sleep data in the diary.</li>
              <li>Review trends weekly to avoid repeating trial-and-error.</li>
              <li>Keep guidance aligned to your child&apos;s current stage.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-5">
            <h3 className="text-xl font-semibold">Who should pick which?</h3>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Pick LunaCradle if you want adaptive weekly recommendations for ages 0-5 and one clear plan workflow.
              Pick Huckleberry if your priority is a native mobile app workflow.
            </p>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              You can also read our broader{' '}
              <Link href={MARKETING_LINKS.compare} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                comparison page
              </Link>{' '}
              for more context.
            </p>
          </div>
        </section>

        <section id="scenarios" className="pb-12">
          <h2 className="text-2xl font-bold">Common scenarios</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <article key={scenario.title} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{scenario.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{scenario.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pb-12">
          <CtaCard
            title="Get a plan that keeps up with your child"
            description="Start with a personalized plan, then refine weekly using your real sleep logs."
            secondaryHref="#comparison"
          />
        </section>

        <section className="pb-12">
          <Faq items={faqItems} />
        </section>

        <section id="related-reading" className="pb-12">
          <h2 className="text-2xl font-bold">Related reading</h2>
          <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-200">
            <li>
              <Link href={MARKETING_LINKS.blog} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                Browse all baby sleep articles
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
                href="/blog/baby-short-naps-30-minutes-why-and-how-to-fix-them"
                className="text-sky-700 dark:text-sky-300 underline underline-offset-2"
              >
                Baby short naps: why they happen and what to do
              </Link>
            </li>
            <li>
              <Link href={MARKETING_LINKS.howItWorks} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
                See how LunaCradle works
              </Link>
            </li>
          </ul>
        </section>

        <section className="pb-10">
          <CtaCard
            title="Ready to start tonight?"
            description="Your intake takes a few minutes, and your first plan is tailored to your child and your comfort level."
            secondaryHref={MARKETING_LINKS.howItWorks}
            secondaryLabel="See how it works"
          />
        </section>

        <section className="pb-16">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Not medical advice. If you have concerns about your child&apos;s health, breathing, feeding, pain, or growth, talk to your pediatrician.
            Review warning signs on our{' '}
            <Link href={MARKETING_LINKS.redFlags} className="text-sky-700 dark:text-sky-300 underline underline-offset-2">
              red flags guidance page
            </Link>
            .
          </p>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Last updated: {MARKETING_LAST_UPDATED}</p>
        </section>
      </main>
    </div>
  )
}
