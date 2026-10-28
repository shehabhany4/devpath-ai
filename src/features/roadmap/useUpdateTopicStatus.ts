import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTopicStatus, type TopicStatus } from './api'
import type { useRoadmap } from './useRoadmap'

type RoadmapData = ReturnType<typeof useRoadmap>['data']

export function useUpdateTopicStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ topicId, status }: { topicId: string; status: TopicStatus }) =>
      updateTopicStatus(topicId, status),

    onMutate: async ({ topicId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['roadmap'] })
      const previous = queryClient.getQueryData<RoadmapData>(['roadmap'])

      queryClient.setQueryData<RoadmapData>(['roadmap'], (old) =>
        old
          ? {
              ...old,
              roadmap_topics: old.roadmap_topics.map((t) =>
                t.id === topicId ? { ...t, status } : t,
              ),
            }
          : old,
      )

      return { previous }
    },

    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['roadmap'], context?.previous)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
    },
  })
}