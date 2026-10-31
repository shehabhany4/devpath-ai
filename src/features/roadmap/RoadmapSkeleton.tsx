import { Skeleton } from '@/components/ui/skeleton'

export function RoadmapSkeleton() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12" aria-busy="true">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-6 h-9 w-3/4" />
      <Skeleton className="mt-3 h-4 w-40" />

      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-card flex gap-4 rounded-xl border p-4"
          >
            <Skeleton className="size-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}