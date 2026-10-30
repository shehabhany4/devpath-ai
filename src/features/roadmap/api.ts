import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type Roadmap = Database['public']['Tables']['roadmaps']['Row']
export type RoadmapTopic = Database['public']['Tables']['roadmap_topics']['Row']
export type TopicStatus = RoadmapTopic['status']

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
  const { data, error } = await supabase.functions.invoke('generate-roadmap', {
    body: input,
  })
  if (error) throw error
  return data as { roadmap_id: string }
}