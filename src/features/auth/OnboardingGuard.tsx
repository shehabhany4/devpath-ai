import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from './useProfile'

export function OnboardingGuard() {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    )
  }

  return profile?.onboarding_completed ? <Outlet /> : <Navigate to="/onboarding" replace />
}