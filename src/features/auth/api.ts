import { supabase } from '@/lib/supabase'
import type { LoginValues, SignupValues } from './schemas'

export async function signUp({ fullName, email, password }: SignupValues) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export async function logIn({ email, password }: LoginValues) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function logOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}