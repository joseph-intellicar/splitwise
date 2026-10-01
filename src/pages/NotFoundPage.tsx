import { Link } from 'react-router'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <p className="font-heading text-5xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn't find what you were looking for. It may have been moved or deleted.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </section>
  )
}
