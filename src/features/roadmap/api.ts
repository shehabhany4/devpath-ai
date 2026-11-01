import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Roadmap = Database['public']['Tables']['roadmaps']['Row']
export type RoadmapTopic = Database['public']['Tables']['roadmap_topics']['Row']
export type TopicStatus = RoadmapTopic['status']

export const RATE_LIMIT_MESSAGE = 'Daily limit reached. Try again tomorrow.'

// بتنادي Edge Function وتحوّل خطأ 429 لرسالة واضحة
export async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    if (status === 429) throw new Error(RATE_LIMIT_MESSAGE)
    throw error
  }
  return data as T
}

export async function getMyRoadmap() {
  const { data, error } = await supabase
    .from('roadmaps')
    .select('*, roadmap_topics(*)')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const topics = [...data.roadmap_topics].sort((a, b) => a.position - b.position)
  return { ...data, roadmap_topics: topics }
}

export async function updateTopicStatus(topicId: string, status: TopicStatus) {
  const { error } = await supabase
    .from('roadmap_topics')
    .update({ status })
    .eq('id', topicId)
  if (error) throw error
}

export async function generateRoadmap(input: {
  goal: string
  level: 'beginner' | 'intermediate' | 'advanced'
  daily_minutes: number
}) {
  return invokeFunction<{ roadmap_id: string }>('generate-roadmap', input)
}

export type TopicDetails = {
  overview: string
  key_points: string[]
  steps: string[]
}

export async function getTopicWithDetails(topicId: string) {
  const { data: topic, error } = await supabase
    .from('roadmap_topics')
    .select('*')
    .eq('id', topicId)
    .single()
  if (error) throw error

  if (topic.details) {
    return { ...topic, details: topic.details as unknown as TopicDetails }
  }

  const data = await invokeFunction<{ details: TopicDetails }>('generate-topic-details', {
    topic_id: topicId,
  })
  return { ...topic, details: data.details }
}