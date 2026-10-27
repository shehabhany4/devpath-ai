import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
      <div className="border-border bg-card text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
        <Sparkles className="text-primary size-4" />
        AI-powered learning paths
      </div>

      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Your personal roadmap to becoming a{' '}
        <span className="text-primary">better developer</span>
      </h1>

      <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
        Assess your skills, get a personalized learning plan, and learn with an AI mentor
        that explains things step by step.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button size="lg">
          Get Started <ArrowRight className="size-4" />
        </Button>
        <Button size="lg" variant="outline">
          See how it works
        </Button>
      </div>
    </section>
  )
}