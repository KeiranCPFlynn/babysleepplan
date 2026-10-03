import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandLogo } from '@/components/brand/brand-logo'
import { MarketingHeader } from '@/components/layout/marketing-header'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { BookOpen, FileText, HeartPulse, RefreshCw, ShieldCheck } from 'lucide-react'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  title: 'About LunaCradle — Our Research & Editorial Standards',
  description:
    'Who makes LunaCradle, how our baby sleep guides are researched against AAP, NHS and WHO guidance, and the standards we hold our content to.',
  alternates: { canonical: `${siteUrl}/about` },
  openGraph: {
    title: 'About LunaCradle — Our Research & Editorial Standards',
    description:
      'How our baby sleep guides are researched against AAP, NHS and WHO guidance, and the standards we hold our content to.',
    url: `${siteUrl}/about`,
  },
}

const pillars = [
  {
    icon: BookOpen,
    title: 'Grounded in published guidance',
    body: "Every guide is written against current published guidance — the American Academy of Pediatrics' safe sleep recommendations, NHS advice for new parents, WHO sleep guidelines for under-5s, and the American Academy of Sleep Medicine's consensus on how much sleep children need at each age.",
  },
  {
    icon: FileText,
    title: 'Sources linked, not just claimed',
    body: 'When a guide cites a recommendation or study, we link to the original source at the bottom of the page so you can check it yourself — at 3am or any other time.',
  },
  {
    icon: RefreshCw,
    title: 'Reviewed and updated',
    body: 'Sleep guidance evolves. We revisit guides when the underlying recommendations change, and each page shows when it was last updated.',
  },
  {
    icon: ShieldCheck,
    title: 'Independent and reader-first',
    body: 'We make money from optional subscriptions to our planning tools — not from advertising, sponsored posts, or selling your data. Guides recommend what the evidence supports, nothing else.',
  },
]

export default function AboutPage() {
  return (
    <div className="marketing-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900">
      <div className="relative">
        <MarketingHeader
          headerClassName="animate-in fade-in slide-in-from-top-4 duration-700"
          links={[
            { href: '/how-it-works', label: 'How It Works' },
            { href: '/science', label: 'Science' },
            { href: '/blog', label: 'Blog' },
            { href: '/free-schedule', label: 'Free Schedule' },
          ]}
          loginHref="/login"
          ctaHref="/signup"
          ctaLabel="Start Free Trial"
        />

        <main className="container mx-auto max-w-3xl px-4 py-16">
          <AnimateOnScroll>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="heading-underline">About LunaCradle</span>
            </h1>
            <p className="text-slate-600 leading-relaxed mb-4">
              LunaCradle is an independent baby sleep planning app and library of practical sleep
              guides, built by a small team of parents and engineers who spent too many nights
              crawling contradictory forum threads. We built the resource we wished had existed:
              sleep schedules, wake windows and settling advice in one place, tied back to the
              published guidance it comes from.
            </p>
            <p className="text-slate-600 leading-relaxed mb-12">
              We are not a medical organisation and we do not employ clinicians. That is exactly
              why we hold our content to a simple standard: say what the guidance says, link to
              where it comes from, and be honest about what is unknown.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <h2 id="editorial-standards" className="text-2xl font-bold mb-6">
              Our editorial standards
            </h2>
          </AnimateOnScroll>
          <div className="grid gap-4 sm:grid-cols-2 mb-12">
            {pillars.map((pillar) => (
              <AnimateOnScroll key={pillar.title}>
                <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <pillar.icon className="h-6 w-6 text-sky-600 mb-3" aria-hidden="true" />
                  <h3 className="font-semibold mb-2">{pillar.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pillar.body}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-6 mb-12">
              <div className="flex items-start gap-3">
                <HeartPulse className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-2">
                    Important: this is not medical advice
                  </h2>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    LunaCradle guides and plans are general information for healthy, full-term
                    babies. They are not a substitute for care from your pediatrician, GP or health
                    visitor. If your baby is unwell, is not gaining weight as expected, or if
                    anything about their breathing or sleep worries you, contact a healthcare
                    professional. Always follow current safe sleep guidance to reduce the risk of
                    SIDS — from the{' '}
                    <a
                      href="https://www.aap.org/en/patient-care/safe-sleep/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-slate-900"
                    >
                      AAP
                    </a>
                    ,{' '}
                    <a
                      href="https://www.nhs.uk/baby/caring-for-a-newborn/sudden-infant-death-syndrome-sids/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-slate-900"
                    >
                      NHS
                    </a>{' '}
                    or{' '}
                    <a
                      href="https://www.lullabytrust.org.uk/safer-sleep-advice/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-slate-900"
                    >
                      Lullaby Trust
                    </a>
                    ).
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 p-8 text-center shadow-lg shadow-sky-200/50">
              <h2 className="text-xl font-bold text-white mb-2">
                Want to see the research itself?
              </h2>
              <p className="text-sky-100 mb-5 max-w-md mx-auto text-sm">
                Our science page lists the key studies and guidelines behind our approach to sleep
                planning — with links to each one.
              </p>
              <Link
                href="/science"
                className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 transition-colors"
              >
                View the research
              </Link>
            </div>
          </AnimateOnScroll>
        </main>

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
                <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                <Link href="/contact" className="hover:text-slate-900">Contact</Link>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 max-w-2xl mx-auto">
              Not medical advice &mdash; always follow your pediatrician&apos;s guidance and AAP safe sleep guidelines.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
