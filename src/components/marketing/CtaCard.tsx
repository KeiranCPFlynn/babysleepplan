import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  MARKETING_PRIMARY_CTA_HREF,
  MARKETING_PRIMARY_CTA_LABEL,
  MARKETING_PRICING_LINES,
} from '@/lib/marketing'
import { TrustBar } from './TrustBar'

type CtaCardProps = {
  title: string
  description: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  showPricing?: boolean
  className?: string
}

export function CtaCard({
  title,
  description,
  primaryHref = MARKETING_PRIMARY_CTA_HREF,
  primaryLabel = MARKETING_PRIMARY_CTA_LABEL,
  secondaryHref,
  secondaryLabel = 'See how it works',
  showPricing = true,
  className,
}: CtaCardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-sky-200 dark:border-slate-700 bg-gradient-to-br from-white via-sky-50/60 to-rose-50/70 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-800/90 p-6 shadow-sm',
        className
      )}
    >
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button asChild className="bg-sky-700 text-white hover:bg-sky-800">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        {secondaryHref && (
          <Button
            asChild
            variant="outline"
            className="border-sky-200 dark:border-slate-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        )}
      </div>

      {showPricing && (
        <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-3 text-sm text-slate-700 dark:text-slate-200">
          {MARKETING_PRICING_LINES.map((line, index) => (
            <p key={line} className={index === 0 ? 'font-medium' : 'text-slate-600 dark:text-slate-300'}>
              {line}
            </p>
          ))}
        </div>
      )}

      <TrustBar className="mt-4" />
    </div>
  )
}
