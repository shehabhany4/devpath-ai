import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Profile = Omit<ProfileRow, 'level'> & { level: Level | null }

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data as Profile
}

export async function completeOnboarding(
  userId: string,
  values: { goal: string; level: Level; daily_minutes: number },
) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...values, onboarding_completed: true })
    .eq('id', userId)
  if (error) throw error
}