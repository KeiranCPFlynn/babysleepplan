import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { Star, CheckCircle, BookOpen } from 'lucide-react'
import { BrandLogo } from '@/components/brand/brand-logo'
import { MarketingHeader } from '@/components/layout/marketing-header'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: "LunaCradle — Personalized Baby Sleep Plans, Ready Tonight",
  description: "We built LunaCradle because every tired parent deserves expert-level sleep guidance without the $500 price tag. Evidence-based AI plans for babies 0–5 years.",
  keywords: [
    'baby sleep plan', 'AI sleep consultant', 'personalized baby sleep',
    'infant sleep schedule', 'baby sleep help', 'toddler sleep plan',
  ],
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "LunaCradle — Personalized Baby Sleep Plans, Ready Tonight",
    description: "We built LunaCradle because every tired parent deserves expert-level sleep guidance without the $500 price tag.",
    url: siteUrl,
  },
}

const foundingOffer = {
  active: true,
  code: 'FOUNDING50',
  discount: '50% off your first 3 months',
  seats: 50,
}

const faqs = [
  {
    q: 'Will this work for my baby?',
    a: 'Plans are personalized to age, temperament, current sleep patterns, and your preferred approach.',
  },
  {
    q: 'What age is this for?',
    a: 'Built for babies and toddlers from birth through 5 years, with age-appropriate guidance.',
  },
  {
    q: 'What research is this based on?',
    a: 'Guidance is informed by AAP, NHS, NICE, WHO, and peer-reviewed pediatric sleep research. See our science page for the full list of studies.',
  },
  {
    q: 'How does an AI sleep planner work?',
    a: 'You answer a short intake about your baby and preferences. Our AI builds a personalized plan grounded in peer-reviewed research, then adapts it weekly based on your Sleep Diary logs.',
  },
  {
    q: 'How does the Sleep Diary work?',
    a: 'Log bedtime, wake time, naps, and night wakings each day. After 3 days the system spots patterns and suggests targeted adjustments to your plan.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'Your subscription continues at $19/month. Cancel anytime from your account.',
  },
]

const jsonLd = {
  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LunaCradle',
    url: siteUrl,
    description: 'Personalized, evidence-based baby sleep plans powered by AI.',
  },
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LunaCradle',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
  },
  faqPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  },
}

export default function HomePage() {
  return (
    <div className="marketing-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 pb-24 pt-[max(0.5rem,env(safe-area-inset-top))] md:pb-0 md:pt-3 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.organization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.faqPage) }} />

      {/* Ambient background blobs with color morphing */}
      <div className="pointer-events-none absolute -top-48 -right-56 hidden md:block h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-300/55 via-pink-300/45 to-amber-200/45 float-reverse blob-morph dark:from-rose-500/20 dark:via-fuchsia-500/15 dark:to-amber-500/10" />
      <div className="pointer-events-none absolute top-16 -left-60 hidden md:block h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/55 via-cyan-200/45 to-indigo-200/40 float blob-morph-alt dark:from-sky-500/20 dark:via-cyan-500/15 dark:to-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-24 right-6 hidden lg:block h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-200/55 via-rose-200/45 to-sky-200/40 float-slow blob-morph dark:from-amber-500/15 dark:via-rose-500/12 dark:to-sky-500/12" />

      <div className="relative">
        {/* 1. Nav */}
        <MarketingHeader
          links={[
            { href: '/how-it-works', label: 'How It Works' },
            { href: '/science', label: 'Science' },
            { href: '/blog', label: 'Blog' },
            { href: '/free-schedule', label: 'Free Schedule' },
          ]}
          loginHref="/login"
          ctaHref="/signup"
          ctaLabel="Get Plan Tonight"
          mobileCtaLabel="Get Plan"
          ctaClassName="cta-bounce"
        />

        {/* 2. Hero */}
        <section className="container mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 hero-load">
              Waking every 60-90 minutes?
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight hero-load hero-load-1">
              Stop the 3am wake-ups with a personalized plan tonight.
            </h1>
            <p className="mt-5 text-base sm:text-lg md:text-xl text-shimmer font-medium max-w-3xl mx-auto hero-load hero-load-2">
              For babies 0&ndash;5, gentle or structured. The sleep plan that learns from your baby.
            </p>
            <div className="mt-7 hero-load hero-load-3">
              <p className="text-base md:text-lg text-slate-600 dark:text-slate-300">
                $0 for 5 days. Then $19/month. Cancel anytime.
              </p>
              <div className="mt-5">
                <Button size="lg" asChild className="w-full sm:w-auto max-w-sm mx-auto bg-sky-700 text-white hover:bg-sky-800 cta-smooth cta-fancy text-base px-6 py-6">
                  <Link href="/signup">
                    <span className="sm:hidden">Get Plan Tonight</span>
                    <span className="hidden sm:inline">Get Your Sleep Plan Tonight</span>
                  </Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Credit card required to start trial.
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Not ready?{' '}
                <Link href="/free-schedule" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-200">
                  Try the free schedule builder
                </Link>{' '}— no account needed.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 hero-load hero-load-3 dark:text-slate-400">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Informed by AAP, NHS, NICE, WHO guidance, and peer-reviewed studies</span>
            </div>
            <div className="mt-8 md:mt-10 hero-load hero-load-3">
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-3 shadow-xl shadow-sky-100/60 backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/85 dark:shadow-none">
                <Image
                  src="/landing/sample-report-preview.svg"
                  alt="Sample LunaCradle report preview based on actual plan format"
                  width={1280}
                  height={920}
                  className="h-auto w-full rounded-2xl border border-slate-100 dark:border-slate-700"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Sample report preview from the real plan format
              </p>
            </div>
          </div>
        </section>

        {/* Founding families offer */}
        {foundingOffer.active && (
          <AnimateOnScroll>
            <section className="pb-6 md:pb-10">
              <div className="container mx-auto px-4">
                <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-rose-50 px-5 py-5 md:px-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                    Founding Families
                  </p>
                  <p className="mt-2 text-slate-800 font-medium">
                    We&apos;re opening LunaCradle to our first {foundingOffer.seats} families. Get {foundingOffer.discount} and help shape the product.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Use code <span className="font-semibold text-slate-800">{foundingOffer.code}</span> at checkout. Limited to first {foundingOffer.seats} redemptions.
                  </p>
                </div>
              </div>
            </section>
          </AnimateOnScroll>
        )}

        {/* 3. How It Works */}
        <section id="how-it-works" className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                <span className="heading-underline">How It Works</span>
              </h2>
              <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">Three steps to a calmer night.</p>
            </AnimateOnScroll>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Tell us about your baby', description: 'A short intake on age, current sleep, and your comfort level.' },
                { step: '2', title: 'Get your plan tonight', description: 'A personalized plan in minutes, with clear bedtime and night steps.' },
                { step: '3', title: 'Your plan updates itself', description: 'Log sleep in under a minute. After 7 days, your plan gets a targeted update from your real data.' },
              ].map((item, index) => (
                <AnimateOnScroll key={item.step} delay={index * 150}>
                  <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-center shadow-sm card-hover">
                    <div className="w-14 h-14 bg-gradient-to-br from-sky-600 to-sky-400 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-sky-200/50">
                      {item.step}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.description}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Living plan feature callout */}
        <AnimateOnScroll>
          <section className="py-14 md:py-18 bg-sky-50/60 dark:bg-slate-900/50 border-y border-sky-100/60 dark:border-slate-800">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-10">Most sleep plans are static. Yours isn&apos;t.</h2>
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                {[
                  { stat: 'Daily', label: 'Sleep log' },
                  { stat: '3 days', label: 'Pattern spotted' },
                  { stat: '7 days', label: 'Plan updated' },
                ].map((item) => (
                  <div key={item.stat} className="rounded-2xl border border-white/70 bg-white/90 px-4 py-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
                    <p className="text-3xl font-bold text-sky-700 dark:text-sky-400">{item.stat}</p>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* 4. Social Proof */}
        <section className="py-16 md:py-20 border-y border-white/60 bg-sky-50/50 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                <span className="heading-underline">Parents Who Needed Sleep Fast</span>
              </h2>
              <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto dark:text-slate-300">
                Different sleep styles, one outcome: calmer nights and clearer next steps.
              </p>
            </AnimateOnScroll>
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {[
                {
                  quote: 'Night 2 felt calmer. Bedtime stopped feeling chaotic.',
                  author: 'Sarah M.',
                  role: 'Mom of 7-month-old',
                },
                {
                  quote: 'The gentle approach matched our comfort level from day one.',
                  author: 'James + Priya',
                  role: 'Parents of 10-month-old',
                },
                {
                  quote: 'Weekly updates kept us moving. We always knew the next adjustment.',
                  author: 'Elena R.',
                  role: 'Mom of 18-month-old',
                },
              ].map((item, index) => (
                <AnimateOnScroll key={item.author} delay={index * 120}>
                  <Card className="h-full border-slate-200 bg-white/85 shadow-sm card-hover dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-black/30">
                    <CardContent className="p-6">
                      <div className="mb-4 flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed dark:text-slate-200">&ldquo;{item.quote}&rdquo;</p>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-600 to-sky-400 text-white text-sm font-semibold grid place-items-center">
                          {item.author.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.author}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">{item.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
            <AnimateOnScroll delay={140}>
              <div className="mt-10 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">Ready for a calmer night?</p>
                <Button size="lg" asChild className="mt-4 w-full sm:w-auto bg-sky-700 text-white hover:bg-sky-800 cta-smooth">
                  <Link href="/signup">Get Your Sleep Plan Tonight</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* 5. Pricing + CTA */}
        <AnimateOnScroll>
          <section id="pricing" className="bg-white/70 py-16 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto">
                <Card className="border-sky-200 bg-white shadow-lg gradient-border rounded-2xl overflow-hidden">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold text-sky-800">LunaCradle</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Informed by AAP, NHS, NICE, WHO, and peer-reviewed sleep research</p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-slate-900">$0 <span className="text-lg font-normal text-slate-500">for 5 days</span></p>
                      <p className="text-sm text-slate-500 mt-1">then $19/month &middot; cancel anytime</p>
                    </div>
                    {foundingOffer.active && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-700">
                        <p className="font-semibold text-amber-800">Founding Families: {foundingOffer.discount}</p>
                        <p className="mt-1">
                          Use code <span className="font-semibold text-slate-800">{foundingOffer.code}</span> at checkout.
                        </p>
                      </div>
                    )}
                    <ul className="space-y-2.5 text-slate-600 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Personalized sleep plan, ready tonight
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Daily sleep diary with pattern tracking
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Plan updates as your baby&apos;s sleep evolves
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Daily checklist &amp; troubleshooting tips
                      </li>
                    </ul>
                    <Button className="w-full bg-sky-700 text-white hover:bg-sky-800 cta-smooth cta-fancy text-base py-6" size="lg" asChild>
                      <Link href="/signup">Get Your Sleep Plan Tonight</Link>
                    </Button>
                    <p className="text-xs text-center text-slate-400">Credit card required. Cancel anytime.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* 6. FAQ */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="heading-underline">FAQ</span>
              </h2>
            </AnimateOnScroll>
            <div className="max-w-2xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <AnimateOnScroll key={index} delay={index * 80}>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm card-hover dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-black/30">
                    <h3 className="font-semibold text-base mb-1 dark:text-slate-100">{faq.q}</h3>
                    <p className="text-slate-600 text-sm dark:text-slate-300">{faq.a}</p>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Footer */}
        <AnimateOnScroll>
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
                  <Link href="/compare" className="hover:text-slate-900">Compare</Link>
                  <Link href="/blog" className="hover:text-slate-900">Blog</Link>
                  <Link href="/free-schedule" className="hover:text-slate-900">Free Schedule</Link>
                  <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                  <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                  <Link href="/contact" className="hover:text-slate-900">Contact</Link>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-slate-400 max-w-2xl mx-auto">
                Not medical advice &mdash; always follow your pediatrician&apos;s guidance and AAP safe sleep guidelines. Guidance is based on published research from leading pediatric sleep organizations. Your data stays private to your account.
              </p>
            </div>
          </footer>
        </AnimateOnScroll>

        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">$0 for 5 days</p>
              <p className="text-xs text-slate-500">Then $19/month, cancel anytime</p>
            </div>
            <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
              <Link href="/signup">Start Tonight</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
