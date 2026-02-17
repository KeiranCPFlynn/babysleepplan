import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnimateOnScroll } from '@/components/ui/animate-on-scroll'
import { Moon, BookOpen, ExternalLink, ArrowLeft } from 'lucide-react'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lunacradle.com'

export const metadata: Metadata = {
  title: "Our Science — Why We Trust the Research Behind Every Plan",
  description:
    "We grounded LunaCradle in NHS, AAP, WHO, and peer-reviewed pediatric sleep research so you don't have to sift through studies at 3am. Here's exactly what informs your plan.",
  keywords: [
    'evidence-based baby sleep',
    'pediatric sleep research',
    'NHS baby sleep guidelines',
    'AAP infant sleep guidelines',
    'baby sleep science',
  ],
  alternates: { canonical: `${siteUrl}/science` },
  openGraph: {
    title: "Our Science — Why We Trust the Research Behind Every Plan",
    description:
      "We grounded LunaCradle in NHS, AAP, WHO, and peer-reviewed pediatric sleep research so you don't have to sift through studies at 3am.",
    url: `${siteUrl}/science`,
  },
}

type Study = {
  authors: string
  year: number
  title: string
  journal: string
  country: string
  url: string
  linkLabel: string
  summary: string
}

const studies = {
  training: [
    {
      authors: 'Mindell, Kuhn, Lewin, Meltzer & Sadeh',
      year: 2006,
      title: 'Behavioral treatment of bedtime problems and night wakings in infants and young children',
      journal: 'Sleep',
      country: 'US / Israel',
      url: 'https://pubmed.ncbi.nlm.nih.gov/17068979/',
      linkLabel: 'PubMed',
      summary:
        'A major review of 52 studies found that behavioral sleep approaches produced lasting results — over 80% of children showed clear improvement that held for 3–6 months.',
    },
    {
      authors: 'Hiscock & Wake',
      year: 2002,
      title: 'Randomised controlled trial of behavioural infant sleep intervention to improve infant sleep and maternal mood',
      journal: 'BMJ',
      country: 'Australia',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC104332/',
      linkLabel: 'Full text (PMC)',
      summary:
        'In a trial of 156 mothers of 6–12-month-olds at the Royal Children\'s Hospital Melbourne, sleep problems resolved in 70% of the intervention group vs. 47% of the control group. Maternal wellbeing also improved.',
    },
    {
      authors: 'Gradisar, Jackson, Spurrier et al.',
      year: 2016,
      title: 'Behavioral interventions for infant sleep problems: A randomized controlled trial',
      journal: 'Pediatrics',
      country: 'Australia',
      url: 'https://pubmed.ncbi.nlm.nih.gov/27221288/',
      linkLabel: 'PubMed',
      summary:
        'Stress hormone levels actually dropped in babies who received sleep support compared to those who didn\'t. At 12 months, there were no differences in emotional wellbeing or parent-child bonding between groups.',
    },
    {
      authors: 'Price, Wake, Ukoumunne & Hiscock',
      year: 2012,
      title: 'Five-year follow-up of harms and benefits of behavioral infant sleep intervention',
      journal: 'Pediatrics',
      country: 'Australia',
      url: 'https://pubmed.ncbi.nlm.nih.gov/22966034/',
      linkLabel: 'PubMed',
      summary:
        'When researchers checked back in at age 6, children who had received sleep support showed no differences from those who hadn\'t — on emotional health, behaviour, sleep habits, stress levels, or closeness with parents.',
    },
  ] satisfies Study[],
  routines: [
    {
      authors: 'Mindell, Telofski, Wiegand & Kurtz',
      year: 2009,
      title: 'A nightly bedtime routine: impact on sleep in young children and maternal mood',
      journal: 'Sleep',
      country: 'US',
      url: 'https://pubmed.ncbi.nlm.nih.gov/19480226/',
      linkLabel: 'PubMed',
      summary:
        'A trial of 405 mothers found that a consistent 3-week bedtime routine led to babies falling asleep faster, waking less at night, and improved mood for mums.',
    },
    {
      authors: 'Mindell, Li, Sadeh, Kwon & Goh',
      year: 2015,
      title: 'Bedtime routines for young children: a dose-dependent association with sleep outcomes',
      journal: 'Sleep',
      country: '17 countries',
      url: 'https://pubmed.ncbi.nlm.nih.gov/25325483/',
      linkLabel: 'PubMed',
      summary:
        'A study of 29,287 children across 17 countries found a clear pattern: the more consistent the bedtime routine, the better the sleep. This held true across different cultures and regions worldwide.',
    },
    {
      authors: 'Mindell & Williamson',
      year: 2018,
      title: 'Benefits of a bedtime routine in young children: Sleep, development, and beyond',
      journal: 'Sleep Medicine Reviews',
      country: 'US',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29195725/',
      linkLabel: 'PubMed',
      summary:
        'A consistent bedtime routine doesn\'t just improve sleep — it also supports language development, literacy, emotional regulation, parent-child bonding, and overall family wellbeing.',
    },
  ] satisfies Study[],
  development: [
    {
      authors: 'Galland, Taylor, Elder & Herbison',
      year: 2012,
      title: 'Normal sleep patterns in infants and children: a systematic review of observational studies',
      journal: 'Sleep Medicine Reviews',
      country: 'New Zealand',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21784676/',
      linkLabel: 'PubMed',
      summary:
        'Researchers at the University of Otago analysed 34 studies to establish what\'s normal for sleep duration, night wakings, and nap patterns at each age — the reference values we use for age-appropriate guidance.',
    },
    {
      authors: 'Ardura, Gutierrez, Andres & Agapito',
      year: 2003,
      title: 'Emergence and evolution of the circadian rhythm of melatonin in children',
      journal: 'Hormone Research',
      country: 'Spain',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12589120/',
      linkLabel: 'PubMed',
      summary:
        'Your baby\'s internal body clock develops gradually: the cortisol rhythm appears around 8 weeks, the melatonin (sleep hormone) rhythm around 9 weeks, and temperature rhythm around 11 weeks. By 3–4 months, most babies are on a 24-hour cycle — which is why the "4-month sleep change" is a real biological event.',
    },
  ] satisfies Study[],
  safeSleep: [
    {
      authors: 'NHS',
      year: 2024,
      title: 'Safe sleep advice for babies',
      journal: 'NHS Best Start in Life',
      country: 'UK',
      url: 'https://www.nhs.uk/conditions/baby/caring-for-a-newborn/reduce-the-risk-of-sudden-infant-death-syndrome/',
      linkLabel: 'NHS',
      summary:
        'Official NHS guidance on reducing the risk of sudden infant death syndrome (SIDS), covering safe sleeping positions, room temperature, bedding, and room-sharing recommendations.',
    },
    {
      authors: 'The Lullaby Trust',
      year: 2024,
      title: 'Safer sleep information for parents',
      journal: 'The Lullaby Trust',
      country: 'UK',
      url: 'https://www.lullabytrust.org.uk/safer-sleep-advice/',
      linkLabel: 'Lullaby Trust',
      summary:
        'The UK\'s leading charity for preventing sudden infant deaths provides evidence-based safer sleep guidance, with clear advice on sleep environment, co-sleeping, and risk reduction.',
    },
    {
      authors: 'Moon, Carlin, Hand & AAP Task Force on SIDS',
      year: 2022,
      title: 'Sleep-Related Infant Deaths: Updated 2022 Recommendations',
      journal: 'Pediatrics',
      country: 'US',
      url: 'https://pubmed.ncbi.nlm.nih.gov/35726558/',
      linkLabel: 'PubMed',
      summary:
        'The current official AAP safe sleep recommendations: always on the back, on a firm flat surface, room sharing without bed sharing, no soft bedding or overheating.',
    },
    {
      authors: 'NICE',
      year: 2021,
      title: 'Postnatal care (NG194) — safer sleeping recommendations',
      journal: 'NICE Guidelines',
      country: 'UK',
      url: 'https://www.nice.org.uk/guidance/ng194',
      linkLabel: 'NICE',
      summary:
        'National Institute for Health and Care Excellence guidance on postnatal care, including specific recommendations on safer sleeping practices and bed-sharing for infants.',
    },
  ] satisfies Study[],
}

const allStudies = [
  ...studies.training,
  ...studies.routines,
  ...studies.development,
  ...studies.safeSleep,
]

const jsonLd = {
  medicalWebPage: {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: 'LunaCradle Science & Methodology',
    url: `${siteUrl}/science`,
    about: {
      '@type': 'MedicalCondition',
      name: 'Pediatric Sleep Problems',
    },
    lastReviewed: '2026-02-01',
    reviewedBy: {
      '@type': 'Organization',
      name: 'LunaCradle',
    },
  },
  itemList: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Research Citations',
    itemListElement: allStudies.map((study, i) => ({
      '@type': 'ScholarlyArticle',
      position: i + 1,
      name: study.title,
      author: study.authors,
      datePublished: String(study.year),
      isPartOf: { '@type': 'Periodical', name: study.journal },
      url: study.url,
    })),
  },
}

function StudyCard({ study }: { study: Study }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {study.authors} ({study.year})
          </p>
          <p className="mt-1 text-sm text-slate-700 italic">{study.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">{study.journal} &middot; {study.country}</p>
        </div>
        <a
          href={study.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
        >
          {study.linkLabel} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{study.summary}</p>
    </div>
  )
}

export default function SciencePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 pb-24 pt-[max(0.5rem,env(safe-area-inset-top))] md:pb-0 md:pt-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.medicalWebPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd.itemList) }} />

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
              <Link href="/how-it-works" className="hidden md:inline-flex text-slate-600 hover:text-slate-900">
                How It Works
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
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700 mb-4">
                <BookOpen className="h-4 w-4" /> Peer-reviewed research
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                The research behind every plan
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                We built LunaCradle on the same evidence base that pediatric sleep specialists use — published in journals like <em>Pediatrics</em>, <em>BMJ</em>, and <em>Sleep</em>, and aligned with guidance from the NHS, AAP, WHO, NICE, and the Lullaby Trust.
              </p>
            </AnimateOnScroll>
          </div>
        </section>

        {/* Principles */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Our guiding principles</h2>
              <div className="space-y-4">
                {[
                  { title: 'Evidence over opinion', text: 'Every method we offer — gentle, gradual, or structured — is backed by published clinical trials or systematic reviews.' },
                  { title: 'Safety first', text: 'All plans align with NHS, AAP (2022), NICE, and Lullaby Trust safe sleep guidelines. We never recommend anything that conflicts with established safety standards.' },
                  { title: 'Personalisation matters', text: 'Research shows that your comfort level and consistency matter as much as the method you choose (Mindell et al., 2006). We match the approach to your family.' },
                  { title: 'Adaptive, not static', text: 'Your Sleep Diary data feeds back into your plan. When patterns shift, we adjust — the same way a sleep specialist would across follow-up sessions.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm">
                    <h3 className="font-semibold text-base mb-1">{item.title}</h3>
                    <p className="text-slate-600 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* Sleep Training Section */}
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Does sleep support actually work? Is it safe?</h2>
              <p className="text-slate-600 mb-8">
                The most common concern parents have is whether helping their baby learn to sleep independently is safe. The short answer: several well-designed clinical trials — plus a study that followed children for 5 years — found no measurable harm to children&apos;s emotional wellbeing, stress levels, or bond with their parents.
              </p>
            </AnimateOnScroll>
            <div className="space-y-4">
              {studies.training.map((study) => (
                <AnimateOnScroll key={study.url}>
                  <StudyCard study={study} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Bedtime Routines */}
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Why bedtime routines matter</h2>
              <p className="text-slate-600 mb-8">
                A consistent bedtime routine is one of the simplest and most effective things you can do for your baby&apos;s sleep — with benefits that go well beyond bedtime.
              </p>
            </AnimateOnScroll>
            <div className="space-y-4">
              {studies.routines.map((study) => (
                <AnimateOnScroll key={study.url}>
                  <StudyCard study={study} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Sleep Development */}
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">What&apos;s normal at each age</h2>
              <p className="text-slate-600 mb-8">
                Knowing what to expect helps set realistic goals. These studies establish the reference values we use for age-appropriate sleep windows, nap schedules, and wake times in your plan.
              </p>
            </AnimateOnScroll>
            <div className="space-y-4">
              {studies.development.map((study) => (
                <AnimateOnScroll key={study.url}>
                  <StudyCard study={study} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* Safe Sleep */}
        <section className="container mx-auto px-4 pb-16">
          <div className="mx-auto max-w-3xl">
            <AnimateOnScroll>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Safe sleep guidelines</h2>
              <p className="text-slate-600 mb-8">
                Every LunaCradle plan is built within the boundaries of current safe sleep recommendations from the NHS, AAP, NICE, and the Lullaby Trust. We never recommend anything that conflicts with these guidelines.
              </p>
            </AnimateOnScroll>
            <div className="space-y-4">
              {studies.safeSleep.map((study) => (
                <AnimateOnScroll key={study.url}>
                  <StudyCard study={study} />
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* How We Use Your Data */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">How we use your Sleep Diary data</h2>
              <p className="text-slate-600 mb-4">
                Research shows that consistency and real-time adjustments are key to success. Your daily Sleep Diary entries feed into your plan so that recommendations stay tuned to your baby&apos;s actual patterns — not generic averages.
              </p>
              <p className="text-slate-600">
                After 3 consecutive days of logging, the system spots trends (e.g. falling asleep faster, persistent night wakings, shorter naps) and suggests targeted adjustments. After 7 days, a weekly review looks at the bigger picture and recommends next steps.
              </p>
              <div className="mt-6">
                <Button asChild variant="outline" className="border-sky-200 text-sky-700 hover:bg-sky-50">
                  <Link href="/how-it-works">See how it works in practice</Link>
                </Button>
              </div>
            </div>
          </section>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll>
          <section className="container mx-auto px-4 pb-20">
            <div className="mx-auto max-w-lg text-center">
              <h2 className="text-2xl font-bold mb-3">Ready for a calmer night?</h2>
              <p className="text-slate-600 text-sm mb-6">
                Get a personalised, research-backed sleep plan tonight.
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
                <Link href="/how-it-works" className="hover:text-slate-900">How It Works</Link>
                <Link href="/compare" className="hover:text-slate-900">Compare</Link>
                <Link href="/blog" className="hover:text-slate-900">Blog</Link>
                <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
                <Link href="/terms" className="hover:text-slate-900">Terms</Link>
                <Link href="/contact" className="hover:text-slate-900">Contact</Link>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-slate-400 max-w-2xl mx-auto">
              Not medical advice &mdash; always follow your GP, health visitor, or paediatrician&apos;s guidance and safe sleep guidelines. Guidance is based on published research from leading pediatric sleep organisations.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
