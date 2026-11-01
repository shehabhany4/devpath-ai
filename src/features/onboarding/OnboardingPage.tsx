import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/AuthProvider'
import { useProfile } from '@/features/auth/useProfile'
import { onboardingSchema, type OnboardingValues } from '@/features/auth/schemas'
import { completeOnboarding } from '@/features/auth/profile'
import { useGenerateRoadmap } from '@/features/roadmap/useGenerateRoadmap'

const OTHER = 'Other'

const goals = [
  'Front-End Developer',
  'Back-End Developer',
  'Full-Stack Developer',
  'Mobile App Developer',
  'Data Analyst',
  'Machine Learning Engineer',
  'AI Engineer',
  'Cybersecurity Engineer',
  'QA / Test Engineer',
  OTHER,
]
const levels = ['beginner', 'intermediate', 'advanced'] as const

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get('edit') === '1'
  const { profile } = useProfile()
  const generate = useGenerateRoadmap()
  const [serverError, setServerError] = useState<string | null>(null)
  const [customGoal, setCustomGoal] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { goal: goals[0], level: 'beginner', daily_minutes: 60 },
    values:
      isEdit && profile?.goal && profile.level && profile.daily_minutes
        ? {
            goal: goals.includes(profile.goal) ? profile.goal : OTHER,
            level: profile.level,
            daily_minutes: profile.daily_minutes,
          }
        : undefined,
  })

  const selectedGoal = watch('goal')

  async function onSubmit(values: OnboardingValues) {
    if (!user) return
    setServerError(null)

    const goal = values.goal === OTHER ? customGoal.trim() : values.goal
    if (!goal) {
      setServerError('Please enter your goal')
      return
    }

    try {
      await completeOnboarding(user.id, { ...values, goal })
      if (isEdit) {
        await generate.mutateAsync({
          goal,
          level: values.level,
          daily_minutes: values.daily_minutes,
        })
        navigate('/roadmap')
        return
      }
      navigate('/dashboard')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const selectClass =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm'

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isEdit ? 'Change your track' : 'Tell us about your goal'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="goal">I want to become a</Label>
              <select id="goal" className={selectClass} {...register('goal')}>
                {goals.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {selectedGoal === OTHER && (
                <Input
                  placeholder="e.g. Cloud Architect"
                  value={customGoal}
                  maxLength={100}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  aria-label="Your custom goal"
                />
              )}
              {errors.goal && (
                <p className="text-destructive text-sm">{errors.goal.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">My current level</Label>
              <select id="level" className={selectClass} {...register('level')}>
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_minutes">Minutes per day</Label>
              <Input id="daily_minutes" type="number" {...register('daily_minutes')} />
              {errors.daily_minutes && (
                <p className="text-destructive text-sm">
                  {errors.daily_minutes.message}
                </p>
              )}
            </div>

            {serverError && <p className="text-destructive text-sm">{serverError}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? isEdit
                  ? 'Generating...'
                  : 'Saving...'
                : isEdit
                  ? 'Generate new roadmap'
                  : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}