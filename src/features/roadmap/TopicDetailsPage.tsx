import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTopicDetails } from './useTopicDetails'

export function TopicDetailsPage() {
  const { topicId = '' } = useParams()
  const { data: topic, isLoading, error } = useTopicDetails(topicId)

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/roadmap" className="text-muted-foreground hover:text-foreground text-sm">
        ← Back to roadmap
      </Link>

      {isLoading && (
        <div className="mt-6 space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {error && (
        <p className="text-destructive mt-6">Failed to load topic details. Try again.</p>
      )}

      {topic && (
        <>
          <h1 className="mt-6 text-3xl font-bold">{topic.title}</h1>
          <p className="text-muted-foreground mt-4">{topic.details.overview}</p>

          <h2 className="mt-8 text-xl font-semibold">Key points</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {topic.details.key_points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>

          <h2 className="mt-8 text-xl font-semibold">How to learn it</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {topic.details.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>

          <Button className="mt-8" render={<Link to={`/roadmap/${topicId}/quiz`} />}>
            Take quiz
          </Button>
        </>
      )}
    </main>
  )
}