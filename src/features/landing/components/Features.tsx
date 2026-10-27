import { BarChart3, Bot, Map, Target, Trophy, ClipboardCheck } from 'lucide-react'

const features = [
  {
    icon: Map,
    title: 'Personalized Roadmap',
    description: 'A learning plan built around your level, goals, and available time.',
  },
  {
    icon: ClipboardCheck,
    title: 'Skill Assessment',
    description: 'Short quizzes that reveal exactly where you stand in each technology.',
  },
  {
    icon: Bot,
    title: 'AI Mentor',
    description: 'Ask any coding question and get a clear, step-by-step explanation.',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'See your completion rate for every topic and stay motivated.',
  },
  {
    icon: Target,
    title: 'Weakness Analysis',
    description: 'Find the topics that need review and get suggested next steps.',
  },
  {
    icon: Trophy,
    title: 'Daily Challenges',
    description: 'Small coding challenges that keep your skills sharp every day.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-6 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to grow
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          One platform for assessment, planning, learning, and review.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="border-border bg-card rounded-xl border p-6">
            <div className="bg-primary/10 text-primary mb-4 flex size-10 items-center justify-center rounded-lg">
              <Icon className="size-5" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}