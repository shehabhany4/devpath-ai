import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Profile = Database['public']['Tables']['profiles']['Row']

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function completeOnboarding(
  userId: string,
  values: { goal: string; level: Profile['level']; daily_minutes: number },
) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...values, onboarding_completed: true })
    .eq('id', userId)
  if (error) throw error
}