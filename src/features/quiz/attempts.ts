import { supabase } from '@/lib/supabase'

export type TopicScore = {
  topic_id: string
  best_percent: number
  last_percent: number
  attempts: number
}

export async function getTopicScores(): Promise<TopicScore[]> {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('topic_id, score, total, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error

  const byTopic = new Map<string, TopicScore>()
  for (const a of data) {
    const percent = Math.round((a.score / a.total) * 100)
    const prev = byTopic.get(a.topic_id)
    byTopic.set(a.topic_id, {
      topic_id: a.topic_id,
      best_percent: Math.max(prev?.best_percent ?? 0, percent),
      last_percent: percent,
      attempts: (prev?.attempts ?? 0) + 1,
    })
  }
  return [...byTopic.values()]
}