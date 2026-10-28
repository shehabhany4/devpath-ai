import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthProvider'
import { logOut } from '@/features/auth/api'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logOut()
    navigate('/')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">
        Welcome, {user?.user_metadata.full_name ?? user?.email}
      </h1>
      <Button variant="outline" onClick={handleLogout}>
        Log out
      </Button>
    </main>
  )
}