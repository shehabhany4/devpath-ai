import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateRoadmap } from './api'

export function useGenerateRoadmap() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateRoadmap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
    },
  })
}