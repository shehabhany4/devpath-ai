import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useRoadmap } from './useRoadmap'
import type { TopicStatus } from './api'
import { useUpdateTopicStatus } from './useUpdateTopicStatus'

const statusIcon: Record<TopicStatus, typeof Circle> = {
  todo: Circle,
  in_progress: Loader2,
  done: CheckCircle2,
}

const nextStatus: Record<TopicStatus, TopicStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
}

export function RoadmapPage() {
  const { data: roadmap, isLoading, error } = useRoadmap()
  const { mutate } = useUpdateTopicStatus()

  if (isLoading) return <p className="text-muted-foreground p-6">Loading...</p>
  if (error) return <p className="text-destructive p-6">Failed to load roadmap</p>
  if (!roadmap) return <p className="text-muted-foreground p-6">No roadmap yet.</p>

  const done = roadmap.roadmap_topics.filter((t) => t.status === 'done').length
  const total = roadmap.roadmap_topics.length

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">{roadmap.title}</h1>
      <p className="text-muted-foreground mt-2">
        {done} of {total} topics completed
      </p>

      <ol className="mt-8 space-y-3">
        {roadmap.roadmap_topics.map((topic) => {
          const Icon = statusIcon[topic.status]
          return (
            <li
              key={topic.id}
              className="border-border bg-card flex gap-4 rounded-xl border p-4"
            >
              <button
                type="button"
                onClick={() =>
                  mutate({ topicId: topic.id, status: nextStatus[topic.status] })
                }
                aria-label={`Change status of ${topic.title}`}
                className="h-fit"
              >
                <Icon
                  className={
                    topic.status === 'done'
                      ? 'text-primary size-5'
                      : 'text-muted-foreground size-5'
                  }
                />
              </button>
              <div>
                <h2 className="font-semibold">{topic.title}</h2>
                <p className="text-muted-foreground text-sm">{topic.description}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </main>
  )
}