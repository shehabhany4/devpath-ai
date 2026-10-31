import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getQuiz, submitQuiz } from './api'

export function useQuiz(topicId: string) {
  return useQuery({
    queryKey: ['quiz', topicId],
    queryFn: () => getQuiz(topicId),
    staleTime: Infinity,
  })
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ quizId, answers }: { quizId: string; answers: number[] }) =>
      submitQuiz(quizId, answers),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topic-scores'] }),
  })
}