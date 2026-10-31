import { supabase } from '@/lib/supabase'

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
  const { data, error } = await supabase.functions.invoke('get-quiz', {
    body: { topic_id: topicId },
  })
  if (error) throw error
  return data as { quiz_id: string; questions: QuizQuestion[] }
}

export async function submitQuiz(quizId: string, answers: number[]) {
  const { data, error } = await supabase.functions.invoke('submit-quiz', {
    body: { quiz_id: quizId, answers },
  })
  if (error) throw error
  return data as QuizResult
}