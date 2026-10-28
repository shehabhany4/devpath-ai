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