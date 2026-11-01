import { invokeFunction } from '@/features/roadmap/api'

export type QuizQuestion = { question: string; options: string[] }

export type QuizResult = {
  score: number
  total: number
  results: {
    question: string
    options: string[]
    selected_index: number
    correct_index: number
    is_correct: boolean
    explanation: string
  }[]
}

export async function getQuiz(topicId: string) {
  return invokeFunction<{ quiz_id: string; questions: QuizQuestion[] }>('get-quiz', {
    topic_id: topicId,
  })
}

export async function submitQuiz(quizId: string, answers: number[]) {
  return invokeFunction<QuizResult>('submit-quiz', { quiz_id: quizId, answers })
}