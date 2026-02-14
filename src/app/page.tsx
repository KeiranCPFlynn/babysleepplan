import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { Moon, Star, Heart, Sparkles, CheckCircle, X, BookOpen, Shield } from 'lucide-react'

const foundingOffer = {
  active: true,
  code: 'FOUNDING50',
  discount: '50% off your first 3 months',
  seats: 50,
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 pb-24 md:pb-0">
      {/* Ambient background blobs with color morphing */}
      <div className="pointer-events-none absolute -top-48 -right-56 hidden md:block h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-300/55 via-pink-300/45 to-amber-200/45 float-reverse blob-morph" />
      <div className="pointer-events-none absolute top-16 -left-60 hidden md:block h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/55 via-cyan-200/45 to-indigo-200/40 float blob-morph-alt" />
      <div className="pointer-events-none absolute -bottom-24 right-6 hidden lg:block h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-200/55 via-rose-200/45 to-sky-200/40 float-slow blob-morph" />

      <div className="relative">
        {/* 1. Nav */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <Moon className="h-7 w-7 text-sky-700" />
              <span className="text-lg font-semibold tracking-tight">LunaCradle</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-sm">
              <Link href="/blog" className="hidden md:inline-flex text-slate-600 hover:text-slate-900">
                Blog
              </Link>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Button asChild className="bg-sky-700 text-white hover:bg-sky-800 cta-bounce">
                <Link href="/signup">
                  <span className="sm:hidden">Get Plan</span>
                  <span className="hidden sm:inline">Get Plan Tonight</span>
                </Link>
              </Button>
            </div>
          </nav>
        </header>

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
              For babies 4-36 months. Gentle or structured methods. Updated weekly.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 hero-load hero-load-2">
              {[
                'Personalized for 4-36 months',
                'No-cry to structured options',
              ].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-700">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7 hero-load hero-load-3">
              <p className="text-base md:text-lg text-slate-600">
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
              <p className="mt-3 text-sm text-slate-500">
                Credit card required to start trial.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 hero-load hero-load-3">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Grounded in AAP, NHS, and peer-reviewed pediatric sleep research</span>
            </div>
            <div className="mt-8 md:mt-10 hero-load hero-load-3">
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-3 shadow-xl shadow-sky-100/60 backdrop-blur">
                <Image
                  src="/landing/sample-report-preview.svg"
                  alt="Sample LunaCradle report preview based on actual plan format"
                  width={1280}
                  height={920}
                  className="h-auto w-full rounded-2xl border border-slate-100"
                  priority
                />
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Sample report preview using test data and your real output structure
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

        {/* Research trust strip */}
        <AnimateOnScroll>
          <section className="py-6 border-y border-white/50 bg-white/40 backdrop-blur-sm">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-sky-600" />
                  <span>AAP safe sleep aligned</span>
                </div>
                <div className="hidden sm:block h-3 w-px bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-sky-600" />
                  <span>Evidence-based guidance</span>
                </div>
                <div className="hidden sm:block h-3 w-px bg-slate-300" />
                <div className="hidden sm:flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-sky-600" />
                  <span>Gentle &amp; structured options</span>
                </div>
                <div className="hidden md:block h-3 w-px bg-slate-300" />
                <div className="hidden md:flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                  <span>Updated with latest research</span>
                </div>
              </div>
            </div>
          </section>
        </AnimateOnScroll>

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
                { step: '1', title: 'Tell us about your baby', description: 'Age, sleep habits, and your comfort level — takes about 3 minutes.' },
                { step: '2', title: 'Get your plan tonight', description: 'A personalized plan grounded in sleep science, ready in minutes.' },
                { step: '3', title: 'Track, adapt, improve', description: 'Log sleep daily. Your plan updates weekly based on real patterns.' },
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

        {/* 4. Social Proof */}
        <section className="py-16 md:py-20 border-y border-white/60 bg-sky-50/50">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                <span className="heading-underline">Parents Who Needed Sleep Fast</span>
              </h2>
              <p className="text-center text-slate-500 mb-12 max-w-2xl mx-auto">
                Real parents, different sleep styles, one common outcome: calmer nights and clearer next steps.
              </p>
            </AnimateOnScroll>
            <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
              {[
                {
                  quote: 'Night 2 already felt different. We had a clear plan, and bedtime stopped feeling chaotic.',
                  author: 'Sarah M.',
                  role: 'Mom of 7-month-old',
                },
                {
                  quote: 'We wanted a gentler approach and it matched our comfort level perfectly from day one.',
                  author: 'James + Priya',
                  role: 'Parents of 10-month-old',
                },
                {
                  quote: 'The weekly updates kept us from getting stuck. We always knew what to adjust next.',
                  author: 'Elena R.',
                  role: 'Mom of 18-month-old',
                },
              ].map((item, index) => (
                <AnimateOnScroll key={item.author} delay={index * 120}>
                  <Card className="h-full border-slate-200 bg-white/85 shadow-sm card-hover">
                    <CardContent className="p-6">
                      <div className="mb-4 flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-600 to-sky-400 text-white text-sm font-semibold grid place-items-center">
                          {item.author.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.author}</p>
                          <p className="text-xs text-slate-500">{item.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
            <AnimateOnScroll delay={140}>
              <div className="mt-10 text-center">
                <p className="text-sm text-slate-600">Ready for a calmer night?</p>
                <Button size="lg" asChild className="mt-4 w-full sm:w-auto bg-sky-700 text-white hover:bg-sky-800 cta-smooth">
                  <Link href="/signup">Get Your Sleep Plan Tonight</Link>
                </Button>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* 5. Comparison */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <AnimateOnScroll>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              <span className="heading-underline">Why Not a Sleep Consultant?</span>
            </h2>
            <p className="text-center text-slate-500 mb-12 max-w-lg mx-auto">Same research. Fraction of the cost.</p>
          </AnimateOnScroll>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <AnimateOnScroll delay={0}>
              <Card className="border-slate-200 bg-white/80 card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">Sleep Consultant</CardTitle>
                  <p className="text-sm text-slate-500">$300+ / 2-week wait</p>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> Scheduling delays</div>
                  <div className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> Manual tracking</div>
                  <div className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> Updates cost extra</div>
                  <div className="flex items-center gap-2"><X className="h-4 w-4 text-slate-400" /> One-size approach</div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
            <AnimateOnScroll delay={150}>
              <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-rose-50 shadow-md card-hover">
                <CardHeader>
                  <CardTitle className="text-lg">LunaCradle</CardTitle>
                  <p className="text-sm text-sky-600 font-medium">Free 5 days, then $19/mo</p>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-sky-600" /> Start tonight</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-sky-600" /> Built-in diary &amp; tracking</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-sky-600" /> Weekly updates included</div>
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-sky-600" /> Based on leading research</div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </section>

        {/* 6. Pricing + CTA with animated gradient border */}
        <AnimateOnScroll>
          <section id="pricing" className="bg-white/70 py-16 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-lg mx-auto">
                <Card className="border-sky-200 bg-white shadow-lg gradient-border rounded-2xl overflow-hidden">
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">LunaCradle</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">Grounded in AAP, NHS &amp; pediatric sleep research</p>
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
                        Weekly plan updates based on your logs
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Daily checklist &amp; troubleshooting tips
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                        Built on research from leading sleep organizations
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

        {/* 7. FAQ */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="heading-underline">FAQ</span>
              </h2>
            </AnimateOnScroll>
            <div className="max-w-2xl mx-auto space-y-4">
              {[
                {
                  q: 'Will this work for my baby?',
                  a: 'Plans are personalized to your child&apos;s age, temperament, and current sleep patterns. You can choose gentle or more structured methods and change course anytime.'
                },
                {
                  q: 'What age is this for?',
                  a: 'Best for 4 months to 3 years. We adjust for your child\u2019s age and development.'
                },
                {
                  q: 'What research is this based on?',
                  a: 'Our guidance draws from the American Academy of Pediatrics (AAP), NHS, and peer-reviewed pediatric sleep research. We stay current as new findings are published.'
                },
                {
                  q: 'Do I have to let my baby cry?',
                  a: 'No. We offer methods from completely no-cry to more structured. You choose what fits your family.'
                },
                {
                  q: 'Is this medical advice?',
                  a: 'No. This is educational guidance based on established research. Always consult your pediatrician for medical concerns.'
                },
                {
                  q: 'What happens after the free trial?',
                  a: 'Your subscription continues at $19/month. Cancel anytime from your account.'
                },
              ].map((faq, index) => (
                <AnimateOnScroll key={index} delay={index * 80}>
                  <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm card-hover">
                    <h3 className="font-semibold text-base mb-1">{faq.q}</h3>
                    <p className="text-slate-600 text-sm">{faq.a}</p>
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
                <div className="flex items-center gap-2">
                  <Moon className="h-6 w-6 text-sky-700" />
                  <span className="font-semibold">LunaCradle</span>
                </div>
                <p className="text-sm text-slate-500">
                  &copy; {new Date().getFullYear()} LunaCradle. All rights reserved.
                </p>
                <div className="flex gap-4 text-sm text-slate-500">
                  <Link href="/blog" className="hover:text-slate-900">Blog</Link>
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
