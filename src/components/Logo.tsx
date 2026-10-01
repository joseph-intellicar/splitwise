import { cn } from '@/lib/utils'

/** Our own mark: a circle split into two halves. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-7', className)}>
      <path d="M16 3a13 13 0 0 0 0 26Z" className="fill-primary" />
      <path d="M18 3.15a13 13 0 0 1 0 25.7Z" className="fill-get-back opacity-60" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
      <LogoMark />
      Splitwise
    </span>
  )
}
