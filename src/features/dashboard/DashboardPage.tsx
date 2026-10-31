import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, LogOut, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'
import { logOut } from '@/features/auth/api'
import { useRoadmap } from '@/features/roadmap/useRoadmap'
import { useTopicScores } from '@/features/quiz/useTopicScores'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: roadmap, isLoading } = useRoadmap()
  const { data: scores = [] } = useTopicScores()

  async function handleLogout() {
    await logOut()
    navigate('/')
  }

  const topics = roadmap?.roadmap_topics ?? []
  const done = topics.filter((t) => t.status === 'done').length
  const percent = topics.length ? Math.round((done / topics.length) * 100) : 0
  const nextTopic =
    topics.find((t) => t.status === 'in_progress') ?? topics.find((t) => t.status === 'todo')

  const weak = scores
    .filter((s) => s.last_percent < 60)
    .map((s) => ({ ...s, topic: topics.find((t) => t.id === s.topic_id) }))
    .filter((s) => s.topic)

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.user_metadata.full_name ?? user?.email}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link to="/mentor" />}>
            <Bot className="size-4" />
            AI Mentor
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground mt-8">Loading...</p>
      ) : !roadmap ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-muted-foreground">You don't have a roadmap yet.</p>
            <Button render={<Link to="/roadmap" />}>
              <Map className="size-4" />
              Create my roadmap
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{roadmap.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={percent} />
              <p className="text-muted-foreground text-sm">
                {done} of {topics.length} topics completed ({percent}%)
              </p>
              <Button variant="outline" render={<Link to="/roadmap" />}>
                View roadmap <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Up next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextTopic ? (
                <>
                  <h2 className="font-semibold">{nextTopic.title}</h2>
                  <p className="text-muted-foreground text-sm">{nextTopic.description}</p>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  All topics completed. Great job! 🎉
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Needs review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weak.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nothing to review yet. Take a quiz to see where you stand.
                </p>
              ) : (
                weak.map((w) => (
                  <div key={w.topic_id} className="flex items-center justify-between gap-4">
                    <Link to={`/roadmap/${w.topic_id}`} className="hover:text-primary text-sm">
                      {w.topic?.title}
                    </Link>
                    <span className="text-destructive text-sm">{w.last_percent}%</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}