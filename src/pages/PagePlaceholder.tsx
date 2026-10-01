import type { ReactNode } from 'react'

export function PagePlaceholder({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{children ?? 'Nothing here yet.'}</p>
    </section>
  )
}
