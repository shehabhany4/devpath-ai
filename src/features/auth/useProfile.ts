import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { getMyProfile, type Profile } from './profile'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    getMyProfile(user.id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [user])

  return { profile, loading }
}