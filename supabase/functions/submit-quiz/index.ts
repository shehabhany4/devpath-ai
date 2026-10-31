import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const inputSchema = z.object({
  quiz_id: z.string().uuid(),
  answers: z.array(z.number().int().min(0).max(3)).min(1).max(20),
})

const storedQuestionsSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()),
    correct_index: z.number().int(),
    explanation: z.string(),
  }),
)

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Invalid input' }, 400)
    const { quiz_id, answers } = parsed.data

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: quiz } = await admin
      .from('quizzes')
      .select('id, topic_id, questions')
      .eq('id', quiz_id)
      .maybeSingle()
    if (!quiz) return json({ error: 'Quiz not found' }, 404)

    // تأكد إن الـ topic بتاع المستخدم (الـ RLS على roadmap_topics)
    const { data: topic } = await userClient
      .from('roadmap_topics')
      .select('id')
      .eq('id', quiz.topic_id)
      .maybeSingle()
    if (!topic) return json({ error: 'Forbidden' }, 403)

    const questions = storedQuestionsSchema.parse(quiz.questions)
    if (answers.length !== questions.length) return json({ error: 'Invalid input' }, 400)

    const results = questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      selected_index: answers[i],
      correct_index: q.correct_index,
      is_correct: answers[i] === q.correct_index,
      explanation: q.explanation,
    }))
    const score = results.filter((r) => r.is_correct).length

    const { error: insertError } = await admin.from('quiz_attempts').insert({
      user_id: userData.user.id,
      quiz_id: quiz.id,
      topic_id: quiz.topic_id,
      score,
      total: questions.length,
      answers,
    })
    if (insertError) {
      console.error('Insert error:', insertError)
      return json({ error: 'Failed to save attempt' }, 500)
    }

    return json({ score, total: questions.length, results })
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'Something went wrong' }, 500)
  }
})