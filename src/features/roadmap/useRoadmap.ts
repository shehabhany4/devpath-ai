import { useQuery } from '@tanstack/react-query'
import { getMyRoadmap } from './api'

export function useRoadmap() {
  return useQuery({
    queryKey: ['roadmap'],
    queryFn: getMyRoadmap,
  })
}