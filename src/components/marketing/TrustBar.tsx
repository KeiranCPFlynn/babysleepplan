import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MARKETING_TRUST_BULLETS } from '@/lib/marketing'

type TrustBarProps = {
  items?: string[]
  className?: string
}

export function TrustBar({ items = MARKETING_TRUST_BULLETS, className }: TrustBarProps) {
  return (
    <ul className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <CheckCircle2 className="h-4 w-4 text-sky-600" />
          {item}
        </li>
      ))}
    </ul>
  )
}
