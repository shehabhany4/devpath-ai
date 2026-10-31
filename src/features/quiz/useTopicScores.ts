import { useQuery } from '@tanstack/react-query'
import { getTopicScores } from './attempts'

export function useTopicScores() {
  return useQuery({ queryKey: ['topic-scores'], queryFn: getTopicScores })
}