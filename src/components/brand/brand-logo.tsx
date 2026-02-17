import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  size?: number
  className?: string
}

export function BrandLogo({ size = 28, className = '' }: BrandLogoProps) {
  return (
    <Image
      src="/logo.svg"
      alt="LunaCradle logo"
      width={size}
      height={size}
      className={cn(
        'rounded-xl shadow-sm shadow-sky-900/5 dark:shadow-black/35 dark:brightness-110',
        className
      )}
    />
  )
}
