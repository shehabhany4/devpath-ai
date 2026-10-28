import { createBrowserRouter } from 'react-router-dom'
import { LandingPage } from '@/features/landing/LandingPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { OnboardingGuard } from '@/features/auth/OnboardingGuard'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RoadmapPage } from '@/features/roadmap/RoadmapPage'

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <OnboardingGuard />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/roadmap', element: <RoadmapPage /> },
        ],
      },
    ],
  },
])