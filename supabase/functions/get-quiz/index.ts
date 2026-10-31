import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const inputSchema = z.object({ topic_id: z.string().uuid() })

const questionsSchema = z
  .array(
    z.object({
      question: z.string().min(1),
      options: z.array(z.string().min(1)).length(3),
      correct_index: z.number().int().min(0).max(2),
      explanation: z.string().min(1),
    }),
  )
  .min(6)
  .max(10)

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function callGemini(model: string, body: string) {
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
      },
      body,
    },
  )
}

async function callWithFallback(body: string) {
  let last: Response | null = null
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await callGemini(model, body)
      if (res.ok) return res
      last = res
      console.error('Gemini error:', model, res.status, await res.clone().text())
      if (res.status !== 503 && res.status !== 429) break
      await new Promise((r) => setTimeout(r, 1500))
    }
  }
  return last!
}

// نشيل الإجابات الصح قبل ما نبعت للمتصفح
function publicQuestions(questions: z.infer<typeof questionsSchema>) {
  return questions.map(({ question, options }) => ({ question, options }))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    // client بصلاحيات المستخدم: للتحقق من الهوية ومن ملكية الـ topic
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Invalid input' }, 400)

    // الـ RLS بيضمن إن الـ topic بتاع المستخدم
    const { data: topic, error: topicError } = await userClient
      .from('roadmap_topics')
      .select('id, title, description, roadmaps(goal)')
      .eq('id', parsed.data.topic_id)
      .single()
    if (topicError || !topic) return json({ error: 'Topic not found' }, 404)

    // client بصلاحيات السيرفر: الوحيد اللي يقدر يقرا/يكتب في quizzes
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: existing } = await admin
      .from('quizzes')
      .select('id, questions')
      .eq('topic_id', topic.id)
      .maybeSingle()

    if (existing) {
      const questions = questionsSchema.parse(existing.questions)
      return json({ quiz_id: existing.id, questions: publicQuestions(questions) })
    }

    const goal = (topic.roadmaps as { goal: string } | null)?.goal ?? 'developer'
    const prompt = `Create a multiple-choice quiz with exactly 8 questions about "${topic.title}"
for someone learning to become a ${goal}. Context: ${topic.description ?? ''}

Requirements:
- Cover the main sub-topics of this topic, not just the basics.
- Mix difficulty: about 3 easy, 3 medium, and 2 hard questions.
- Each question has exactly 3 options, one correct answer (correct_index from 0 to 2).
- Keep every question and every option short.
- Keep each explanation to one short sentence.
- Vary the position of the correct answer.
- Do not repeat the same idea in two questions.`

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: { type: 'ARRAY', items: { type: 'STRING' } },
              correct_index: { type: 'INTEGER' },
              explanation: { type: 'STRING' },
            },
            required: ['question', 'options', 'correct_index', 'explanation'],
          },
        },
      },
    })

    const geminiRes = await callWithFallback(geminiBody)
    if (!geminiRes.ok) return json({ error: 'AI service failed' }, 502)

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    const output = questionsSchema.safeParse(JSON.parse(text))
    if (!output.success) {
      console.error('Invalid AI output:', text)
      return json({ error: 'AI returned invalid data' }, 502)
    }

    const { data: created, error: insertError } = await admin
      .from('quizzes')
      .insert({ topic_id: topic.id, questions: output.data })
      .select('id')
      .single()
    if (insertError) {
      console.error('Insert error:', insertError)
      return json({ error: 'Failed to save quiz' }, 500)
    }

    return json({ quiz_id: created.id, questions: publicQuestions(output.data) })
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'Something went wrong' }, 500)
  }
})