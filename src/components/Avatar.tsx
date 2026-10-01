import { cn } from '@/lib/utils'

// Light and dark pairs; a name always gets the same one.
const PALETTE = [
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
  'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200',
]

function initials(name: string) {
  const words = name.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? words.at(-1)![0] : '')).toUpperCase()
}

function colourFor(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

/** Coloured initials for a person. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-12 shrink-0 items-center justify-center rounded-full font-heading text-base font-semibold',
        colourFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
