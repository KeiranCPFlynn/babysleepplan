import Link from 'next/link'
import { BrandLogo } from '@/components/brand/brand-logo'
import { MarketingHeader } from '@/components/layout/marketing-header'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-rose-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute -top-48 -right-56 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-rose-300/80 via-pink-300/70 to-amber-200/70 float-reverse blob-morph dark:from-rose-500/22 dark:via-fuchsia-500/16 dark:to-amber-500/10" />
      <div className="pointer-events-none absolute top-16 -left-60 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-sky-300/85 via-cyan-200/70 to-indigo-200/60 float blob-morph-alt dark:from-sky-500/22 dark:via-cyan-500/16 dark:to-indigo-500/10" />
      <div className="pointer-events-none absolute -bottom-24 right-6 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-amber-200/80 via-rose-200/70 to-sky-200/60 float-slow blob-morph dark:from-amber-500/14 dark:via-rose-500/12 dark:to-sky-500/10" />

      {/* Twinkling stars */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[8%] left-[15%] h-1.5 w-1.5 rounded-full bg-sky-400/40 twinkle" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[12%] right-[20%] h-1 w-1 rounded-full bg-amber-400/40 twinkle-slow" style={{ animationDelay: '0.7s' }} />
        <div className="absolute top-[25%] left-[8%] h-1 w-1 rounded-full bg-rose-400/30 twinkle-fast" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[18%] right-[35%] h-1.5 w-1.5 rounded-full bg-violet-400/30 twinkle" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[5%] left-[55%] h-1 w-1 rounded-full bg-amber-300/30 twinkle-fast" style={{ animationDelay: '1.8s' }} />
      </div>

      <div className="relative">
        {/* Nav */}
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
          ctaClassName="cta-bounce"
          activeHref="/blog"
        />

        {/* Content */}
        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/70 py-10 mt-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <BrandLogo size={24} className="h-6 w-6" />
                <span className="font-semibold text-sky-800">LunaCradle</span>
              </div>
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
