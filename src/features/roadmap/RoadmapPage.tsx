import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/auth/useProfile'
import { useRoadmap } from './useRoadmap'
import type { TopicStatus } from './api'
import { useUpdateTopicStatus } from './useUpdateTopicStatus'
import { useGenerateRoadmap } from './useGenerateRoadmap'

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
  const { profile } = useProfile()
  const generate = useGenerateRoadmap()

  function handleGenerate() {
    if (!profile?.goal || !profile.level || !profile.daily_minutes) return
    generate.mutate({
      goal: profile.goal,
      level: profile.level,
      daily_minutes: profile.daily_minutes,
    })
  }

  if (isLoading) return <p className="text-muted-foreground p-6">Loading...</p>
  if (error) return <p className="text-destructive p-6">Failed to load roadmap</p>

  if (!roadmap)
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">You don't have a roadmap yet.</p>
        <Button onClick={handleGenerate} disabled={generate.isPending}>
          <Sparkles className="size-4" />
          {generate.isPending ? 'Generating...' : 'Generate my roadmap'}
        </Button>
        {generate.isError && (
          <p className="text-destructive text-sm">Something went wrong. Try again.</p>
        )}
      </main>
    )

  const done = roadmap.roadmap_topics.filter((t) => t.status === 'done').length
  const total = roadmap.roadmap_topics.length

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{roadmap.title}</h1>
          <p className="text-muted-foreground mt-2">
            {done} of {total} topics completed
          </p>
        </div>
        <Button variant="outline" onClick={handleGenerate} disabled={generate.isPending}>
          <Sparkles className="size-4" />
          {generate.isPending ? 'Generating...' : 'New roadmap'}
        </Button>
      </div>

      {generate.isError && (
        <p className="text-destructive mt-4 text-sm">Something went wrong. Try again.</p>
      )}

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
                className="hover:bg-muted h-fit cursor-pointer rounded-full p-1 transition-colors"
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