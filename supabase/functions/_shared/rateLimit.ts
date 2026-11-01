import { createClient } from 'npm:@supabase/supabase-js@2'

const WINDOW_MS = 24 * 60 * 60 * 1000

export const LIMITS = {
  'generate-roadmap': 5,
  'generate-topic-details': 30,
  'get-quiz': 20,
  'mentor-chat': 40,
} as const

export type Action = keyof typeof LIMITS

function admin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
}

// بترجّع true لو المستخدم لسه ضمن الحد، وبتسجّل الاستخدام
export async function checkAndRecord(userId: string, action: Action) {
  const db = admin()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count, error } = await db
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', since)

  if (error) {
    console.error('Rate limit check failed:', error)
    return true // لو الفحص فشل منوقفش المستخدم
  }
  if ((count ?? 0) >= LIMITS[action]) return false

  await db.from('ai_usage').insert({ user_id: userId, action })
  return true
}