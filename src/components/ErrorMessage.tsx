import { Button } from '@/components/ui/button'
import { RATE_LIMIT_MESSAGE } from '@/features/roadmap/api'

export function ErrorMessage({
  error,
  fallback = 'Something went wrong.',
  onRetry,
}: {
  error: unknown
  fallback?: string
  onRetry?: () => void
}) {
  const isLimit = error instanceof Error && error.message === RATE_LIMIT_MESSAGE

  return (
    <div role="alert" className="border-border bg-card mt-6 rounded-xl border p-4">
      <p className="text-destructive text-sm">{isLimit ? RATE_LIMIT_MESSAGE : fallback}</p>
      {!isLimit && onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}