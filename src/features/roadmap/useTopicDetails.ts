import { useQuery } from '@tanstack/react-query'
import { getTopicWithDetails } from './api'

export function useTopicDetails(topicId: string) {
  return useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => getTopicWithDetails(topicId),
    staleTime: Infinity,
  })
}