import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { ArrowLeft, CheckCircle, XCircle, Minus } from 'lucide-react'
import { BrandLogo } from '@/components/brand/brand-logo'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: "LunaCradle vs Sleep Consultants — Same Science, Fraction of the Cost",
  description:
    "We built what we wished existed: expert-level baby sleep plans without the $200–$500 consultant fee. See how LunaCradle compares.",
  keywords: [
    'sleep consultant vs AI sleep planner',
    'baby sleep consultant alternative',
    'affordable baby sleep plan',
    'best baby sleep app 2026',
    'is a baby sleep consultant worth it',
  ],
  alternates: { canonical: `${siteUrl}/compare` },
  openGraph: {
    title: "LunaCradle vs Sleep Consultants — Same Science, Fraction of the Cost",
    description:
      "We built what we wished existed: expert-level baby sleep plans without the $200–$500 consultant fee.",
    url: `${siteUrl}/compare`,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'LunaCradle',
  description: 'Personalized, evidence-based baby sleep plans powered by AI.',
  url: siteUrl,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: '5-day free trial, then $19/month',
    availability: 'https://schema.org/InStock',
  },
}

type Feature = {
  name: string
  lunaCradle: 'yes' | 'no' | 'partial' | string
  consultant: 'yes' | 'no' | 'partial' | string
}

const features: Feature[] = [
  { name: 'Personalized to your baby', lunaCradle: 'yes', consultant: 'yes' },
  { name: 'Evidence-based methodology', lunaCradle: 'yes', consultant: 'Varies by consultant' },
  { name: 'Available tonight', lunaCradle: 'yes', consultant: '1–3 week waitlist typical' },
  { name: 'Available at 3am', lunaCradle: 'yes', consultant: 'no' },
  { name: 'Ongoing plan adjustments', lunaCradle: 'Weekly, data-driven', consultant: '1–2 follow-ups typical' },
  { name: 'Sleep diary with pattern tracking', lunaCradle: 'yes', consultant: 'Usually manual / pen & paper' },
  { name: 'Adapts as baby grows', lunaCradle: 'yes', consultant: 'New engagement needed' },
  { name: 'Warm, supportive guidance', lunaCradle: 'Built into every plan', consultant: 'yes' },
  { name: 'Complex medical situations', lunaCradle: 'Refers to pediatrician', consultant: 'Some specialize in this' },
]

function FeatureIcon({ value }: { value: string }) {
  if (value === 'yes') return <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
  if (value === 'no') return <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
  if (value === 'partial') return <Minus className="h-4 w-4 text-amber-500 shrink-0" />
  return null
}

export default function ComparePage() {
  return (
    <div className="marketing-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 pb-24 pt-[max(0.5rem,env(safe-area-inset-top))] md:pb-0 md:pt-3 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pointer-events-none absolute -top-48 -right-56 hidden md:block h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-300/55 via-pink-300/45 to-amber-200/45 float-reverse blob-morph dark:from-rose-500/20 dark:via-fuchsia-500/15 dark:to-amber-500/10" />
      <div className="pointer-events-none absolute top-16 -left-60 hidden md:block h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/55 via-cyan-200/45 to-indigo-200/40 float blob-morph-alt dark:from-sky-500/20 dark:via-cyan-500/15 dark:to-indigo-500/10" />

      <div className="relative">
        {/* Nav */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/75">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={28} className="h-7 w-7" />
              <span className="text-lg font-semibold tracking-tight text-sky-800 dark:text-sky-200">LunaCradle</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4 text-sm">
              <Link href="/how-it-works" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                How It Works
              </Link>
              <Link href="/science" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Science
              </Link>
              <Link href="/blog" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Blog
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                Log in
              </Link>
              <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
                <Link href="/signup">Get Plan Tonight</Link>
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="container mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-sky-700 hover:text-sky-800 mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <AnimateOnScroll>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                LunaCradle vs. sleep consultants
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Sleep consultants do good work. We built LunaCradle to make that same research-backed guidance accessible to every family — not just those who can afford $200–$500 per engagement.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Price comparison */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-3xl">
              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="border-sky-200 bg-white shadow-lg">
                  <CardContent className="p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 mb-2">LunaCradle</p>
                    <p className="text-4xl font-bold text-slate-900">$0</p>
                    <p className="text-sm text-slate-500 mt-1">for 5 days, then $19/mo</p>
                    <p className="text-xs text-slate-400 mt-2">Cancel anytime. Includes ongoing updates.</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/80">
                  <CardContent className="p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Typical Sleep Consultant</p>
                    <p className="text-4xl font-bold text-slate-900">$200–$500</p>
                    <p className="text-sm text-slate-500 mt-1">per engagement</p>
                    <p className="text-xs text-slate-400 mt-2">1–3 week wait. Usually 1–2 follow-ups included.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* Feature comparison table */}
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Feature-by-feature comparison</h2>
            </AnimateOnScroll>
            <AnimateOnScroll>
              <div className="rounded-2xl border border-white/70 bg-white/80 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <div>Feature</div>
                  <div className="text-center">LunaCradle</div>
                  <div className="text-center">Consultant</div>
                </div>
                {/* Rows */}
                {features.map((feature, i) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-3 gap-4 px-5 py-3.5 text-sm ${
                      i < features.length - 1 ? 'border-b border-slate-50' : ''
                    }`}
                  >
                    <div className="text-slate-700 font-medium">{feature.name}</div>
                    <div className="flex items-center justify-center gap-1.5 text-center">
                      <FeatureIcon value={feature.lunaCradle} />
                      {feature.lunaCradle !== 'yes' && feature.lunaCradle !== 'no' && feature.lunaCradle !== 'partial' && (
                        <span className="text-xs text-slate-600">{feature.lunaCradle}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-center">
                      <FeatureIcon value={feature.consultant} />
                      {feature.consultant !== 'yes' && feature.consultant !== 'no' && feature.consultant !== 'partial' && (
                        <span className="text-xs text-slate-600">{feature.consultant}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* When a consultant is the right choice */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">When a consultant might be the right choice</h2>
              <p className="text-slate-600 mb-6">
                We believe in being honest about where LunaCradle fits. A human sleep consultant may be a better fit if:
              </p>
              <div className="space-y-3">
                {[
                  'Your baby has a diagnosed medical condition affecting sleep (severe reflux, sleep apnea, neurological conditions)',
                  'You need hands-on emotional support and someone to talk through anxiety with in real-time',
                  'Your pediatrician has recommended specialist evaluation for sleep-disordered breathing',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-600">
                For the majority of families dealing with typical sleep challenges — night wakings, short naps, bedtime resistance, regressions — LunaCradle provides the same evidence-based guidance at a fraction of the cost, with ongoing plan adjustments that most consultants don&apos;t include.
              </p>
            </div>
          </section>
        </AnimateOnScroll>

        {/* Evidence section */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-3xl rounded-2xl border border-sky-200 bg-sky-50/50 p-6">
              <h2 className="text-lg font-bold mb-2">Same research, different delivery</h2>
              <p className="text-sm text-slate-600 mb-4">
                Both good consultants and LunaCradle draw from the same evidence base: peer-reviewed research published in <em>Pediatrics</em>, <em>BMJ</em>, <em>Sleep</em>, and aligned with AAP, NHS, and WHO guidelines. The difference is access and cost.
              </p>
              <Button asChild variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-100">
                <Link href="/science">See the research behind LunaCradle</Link>
              </Button>
            </div>
          </section>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-20">
            <div className="mx-auto max-w-lg text-center">
              <h2 className="text-2xl font-bold mb-3">Ready for a calmer night?</h2>
              <p className="text-slate-600 text-sm mb-6">
                Get a personalized, research-backed sleep plan tonight.
              </p>
              <Button size="lg" asChild className="w-full sm:w-auto bg-sky-700 text-white hover:bg-sky-800 cta-smooth cta-fancy text-base px-6 py-6">
                <Link href="/signup">Get Your Sleep Plan Tonight</Link>
              </Button>
              <p className="mt-3 text-sm text-slate-500">$0 for 5 days. Then $19/month. Cancel anytime.</p>
            </div>
          </section>
        </AnimateOnScroll>

        {/* Footer */}
        <footer className="border-t border-white/70 py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2">
                <BrandLogo size={24} className="h-6 w-6" />
                <span className="font-semibold text-sky-800">LunaCradle</span>
              </Link>
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} LunaCradle. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                <Link href="/how-it-works" className="hover:text-slate-900">How It Works</Link>
                <Link href="/science" className="hover:text-slate-900">Science</Link>
                <Link href="/blog" className="hover:text-slate-900">Blog</Link>
                <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                <Link href="/contact" className="hover:text-slate-900">Contact</Link>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 max-w-2xl mx-auto">
              Not medical advice &mdash; always follow your pediatrician&apos;s guidance and AAP safe sleep guidelines. Guidance is based on published research from leading pediatric sleep organizations.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
