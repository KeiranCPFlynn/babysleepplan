import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { Moon, ArrowLeft, ClipboardList, Sparkles, BarChart3, BookOpen, CalendarDays, TrendingUp } from 'lucide-react'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: "How It Works — Your Sleep Plan in 3 Steps",
  description:
    "We designed LunaCradle to give you a personalized, research-backed sleep plan tonight — not next week. Here's how our AI builds your baby's plan.",
  keywords: [
    'AI baby sleep planner',
    'personalized baby sleep plan',
    'how baby sleep plans work',
    'baby sleep diary tracker',
  ],
  alternates: { canonical: `${siteUrl}/how-it-works` },
  openGraph: {
    title: "How It Works — Your Sleep Plan in 3 Steps",
    description:
      "We designed LunaCradle to give you a personalized, research-backed sleep plan tonight — not next week.",
    url: `${siteUrl}/how-it-works`,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Get a Personalized Baby Sleep Plan with LunaCradle',
  description: 'Three steps to a calmer night: answer a short intake, receive your personalized plan, then track and refine with the Sleep Diary.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Tell us about your baby',
      text: 'Answer a short intake questionnaire about your baby\'s age, current sleep patterns, night wakings, nap schedule, and your preferred approach (gentle, gradual, or structured).',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Get your plan tonight',
      text: 'Our AI builds a personalized sleep plan in minutes, grounded in peer-reviewed research from journals like Pediatrics, BMJ, and Sleep. Your plan includes a bedtime routine, night response steps, nap guidance, and a daily checklist.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Track and refine with the Sleep Diary',
      text: 'Log bedtime, wake time, night wakings, and naps each day. After 3 days, the system spots patterns and suggests targeted adjustments. After 7 days, a weekly review assesses overall progress.',
    },
  ],
}

const steps = [
  {
    number: '1',
    icon: ClipboardList,
    title: 'Tell us about your baby',
    description: 'A short intake questionnaire covers age, current sleep patterns, night wakings, nap schedule, and your preferred approach — gentle, gradual, or structured.',
    details: [
      'Takes about 5 minutes',
      'Covers feeding, sleep environment, and temperament',
      'Your comfort level drives the method selection',
    ],
  },
  {
    number: '2',
    icon: Sparkles,
    title: 'Get your plan tonight',
    description: 'Our AI builds a personalized sleep plan in minutes, grounded in peer-reviewed research. Your plan includes everything you need to start tonight.',
    details: [
      'Clear bedtime routine and night response steps',
      'Age-appropriate nap schedule and wake windows',
      'Daily checklist and troubleshooting tips',
      'Downloadable PDF for offline reference',
    ],
  },
  {
    number: '3',
    icon: BarChart3,
    title: 'Track and refine',
    description: 'Log sleep daily and get practical adjustments from your real patterns — not generic advice. Your plan evolves as your baby does.',
    details: [
      'Sleep Diary captures bedtime, wakings, naps, and mood',
      '3-day updates target emerging patterns',
      '7-day weekly reviews assess overall trajectory',
      'Plan updates are grounded in the same research base',
    ],
  },
]

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 pb-24 pt-[max(0.5rem,env(safe-area-inset-top))] md:pb-0 md:pt-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pointer-events-none absolute -top-48 -right-56 hidden md:block h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-300/55 via-pink-300/45 to-amber-200/45 float-reverse blob-morph" />
      <div className="pointer-events-none absolute top-16 -left-60 hidden md:block h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/55 via-cyan-200/45 to-indigo-200/40 float blob-morph-alt" />

      <div className="relative">
        {/* Nav */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <Link href="/" className="flex items-center gap-2">
              <Moon className="h-7 w-7 text-sky-700" />
              <span className="text-lg font-semibold tracking-tight">LunaCradle</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4 text-sm">
              <Link href="/science" className="hidden md:inline-flex text-slate-600 hover:text-slate-900">
                Science
              </Link>
              <Link href="/blog" className="hidden md:inline-flex text-slate-600 hover:text-slate-900">
                Blog
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
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
                Your personalized sleep plan in 3 steps
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                We designed LunaCradle to give you a clear, research-backed plan tonight — not next week. No waitlists, no scheduling, no $500 consultant fees.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Steps */}
        <section className="container mx-auto px-4 pb-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {steps.map((step, index) => (
              <AnimateOnScroll key={step.number} delay={index * 120}>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-6 md:p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-600 to-sky-400 text-white rounded-full flex items-center justify-center text-xl font-bold shrink-0 shadow-lg shadow-sky-200/50">
                      {step.number}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <step.icon className="h-5 w-5 text-sky-600" />
                        <h2 className="text-xl font-bold">{step.title}</h2>
                      </div>
                      <p className="text-slate-600">{step.description}</p>
                      <ul className="mt-4 space-y-2">
                        {step.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-2 text-sm text-slate-600">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </section>

        {/* Sleep Diary Deep Dive */}
        <section id="sleep-diary" className="py-16 md:py-20 border-y border-white/60 bg-sky-50/50">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <div className="mx-auto max-w-3xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">The Sleep Diary: your daily feedback loop</h2>
                <p className="text-slate-600 mb-8">
                  Research shows that tracking and real-time adjustment are key predictors of sleep training success. The Sleep Diary turns your daily observations into targeted plan improvements.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { icon: CalendarDays, title: 'Log daily', text: 'Bedtime, wake time, night wakings, naps, and mood — takes under a minute.' },
                    { icon: TrendingUp, title: '3-day updates', text: 'After 3 consecutive days, the system spots patterns and suggests targeted adjustments.' },
                    { icon: BookOpen, title: 'Weekly reviews', text: 'After 7 days, a comprehensive review assesses overall trajectory and next steps.' },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm text-center">
                      <item.icon className="h-8 w-8 text-sky-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                      <p className="text-slate-600 text-xs">{item.text}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-slate-600">
                  The same <Link href="/science" className="text-sky-700 underline underline-offset-2 hover:text-sky-800">peer-reviewed research</Link> that builds your initial plan also drives every diary-based update. Your plan evolves with your baby — not on a fixed schedule.
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* What's in your plan */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 py-16 md:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">What&apos;s in your plan</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: 'Bedtime routine', text: 'Step-by-step routine matched to your baby\'s age and temperament.' },
                  { title: 'Night response plan', text: 'Clear instructions for how to respond when your baby wakes at night.' },
                  { title: 'Nap schedule', text: 'Age-appropriate nap timing, duration, and transition guidance.' },
                  { title: 'Daily checklist', text: 'A practical daily checklist to keep you on track without overwhelm.' },
                  { title: 'Troubleshooting tips', text: 'Common setbacks and what to do — regressions, teething, illness.' },
                  { title: 'Downloadable PDF', text: 'Take your plan offline. Share with a partner or caregiver.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-600 text-xs">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-20">
            <div className="mx-auto max-w-lg text-center">
              <h2 className="text-2xl font-bold mb-3">Ready to start?</h2>
              <p className="text-slate-600 text-sm mb-6">
                Get a personalized, research-backed sleep plan in minutes.
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
                <Moon className="h-6 w-6 text-sky-700" />
                <span className="font-semibold">LunaCradle</span>
              </Link>
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} LunaCradle. All rights reserved.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                <Link href="/science" className="hover:text-slate-900">Science</Link>
                <Link href="/compare" className="hover:text-slate-900">Compare</Link>
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
