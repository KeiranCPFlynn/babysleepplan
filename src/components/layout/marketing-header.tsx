'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/brand-logo'
import { cn } from '@/lib/utils'

type MarketingNavItem = {
  href: string
  label: string
}

type MarketingHeaderProps = {
  links?: MarketingNavItem[]
  loginHref?: string
  loginLabel?: string
  ctaHref?: string
  ctaLabel?: string
  mobileCtaLabel?: string
  activeHref?: string
  headerClassName?: string
  navClassName?: string
  ctaClassName?: string
}

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false
  if (pathname === href) return true
  if (href === '/') return false
  return pathname.startsWith(`${href}/`)
}

export function MarketingHeader({
  links = [],
  loginHref,
  loginLabel = 'Log in',
  ctaHref,
  ctaLabel,
  mobileCtaLabel,
  activeHref,
  headerClassName,
  navClassName,
  ctaClassName,
}: MarketingHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const desktopLinkClass = (href: string) =>
    cn(
      'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100',
      (activeHref === href || (activeHref === undefined && isActivePath(pathname, href))) &&
        'font-medium text-sky-700 dark:text-sky-300'
    )

  const mobileLinkClass = (href: string) =>
    cn(
      'block rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-100',
      (activeHref === href || (activeHref === undefined && isActivePath(pathname, href))) &&
        'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
    )

  return (
    <header className={cn('container mx-auto px-4 py-6', headerClassName)}>
      <nav
        className={cn(
          'flex items-center justify-between rounded-3xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/75',
          navClassName
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo size={28} className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight text-sky-800 dark:text-sky-200">LunaCradle</span>
        </Link>

        <div className="hidden md:flex items-center gap-3 sm:gap-4 text-sm">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={desktopLinkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          {loginHref && (
            <Link href={loginHref} className={desktopLinkClass(loginHref)}>
              {loginLabel}
            </Link>
          )}
          {ctaHref && ctaLabel && (
            <Button asChild className={cn('bg-sky-700 text-white hover:bg-sky-800', ctaClassName)}>
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {ctaHref && ctaLabel && (
            <Button asChild className={cn('bg-sky-700 text-white hover:bg-sky-800', ctaClassName)}>
              <Link href={ctaHref}>{mobileCtaLabel ?? ctaLabel}</Link>
            </Button>
          )}
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-slate-200 bg-white/90 p-2 text-slate-700 shadow-sm transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:text-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden transition-opacity',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
        <div
          className={cn(
            'absolute inset-y-0 right-0 w-[min(22rem,88vw)] bg-white/95 p-4 shadow-2xl backdrop-blur-md transition-transform duration-200 dark:bg-slate-950/95',
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BrandLogo size={24} className="h-6 w-6" />
              <span className="font-semibold tracking-tight text-sky-800 dark:text-sky-200">LunaCradle</span>
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={mobileLinkClass(item.href)}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {loginHref && (
              <Link
                href={loginHref}
                className={mobileLinkClass(loginHref)}
                onClick={() => setMobileOpen(false)}
              >
                {loginLabel}
              </Link>
            )}
          </div>

          {ctaHref && ctaLabel && (
            <Button asChild className={cn('mt-5 w-full bg-sky-700 text-white hover:bg-sky-800', ctaClassName)}>
              <Link href={ctaHref} onClick={() => setMobileOpen(false)}>
                {ctaLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
