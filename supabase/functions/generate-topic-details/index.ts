import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'
import { checkAndRecord } from '../_shared/rateLimit.ts'

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const inputSchema = z.object({ topic_id: z.string().uuid() })

const outputSchema = z.object({
  overview: z.string().min(1),
  key_points: z.array(z.string().min(1)).min(3).max(8),
  steps: z.array(z.string().min(1)).min(3).max(8),
})

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Invalid input' }, 400)

    // الـ RLS بيضمن إن الـ topic بتاع المستخدم
    const { data: topic, error: topicError } = await supabase
      .from('roadmap_topics')
      .select('id, title, description, details, roadmaps(goal)')
      .eq('id', parsed.data.topic_id)
      .single()
    if (topicError || !topic) return json({ error: 'Topic not found' }, 404)

    // لو الشرح موجود، رجّعه من غير ما نكلّم الـ AI (ومن غير ما يتحسب)
    if (topic.details) return json({ details: topic.details })

    // Rate limiting
    if (!(await checkAndRecord(userData.user.id, 'generate-topic-details'))) {
      return json({ error: 'Daily limit reached. Try again tomorrow.' }, 429)
    }

    const goal = (topic.roadmaps as { goal: string } | null)?.goal ?? 'developer'
    const prompt = `Explain the topic "${topic.title}" for someone learning to become a ${goal}.
Context: ${topic.description ?? ''}
Return a short overview, 4 to 6 key points, and 4 to 6 concrete learning steps.
Do not number the items.`

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            overview: { type: 'STRING' },
            key_points: { type: 'ARRAY', items: { type: 'STRING' } },
            steps: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['overview', 'key_points', 'steps'],
        },
      },
    })

    const geminiRes = await callWithFallback(geminiBody)
    if (!geminiRes.ok) return json({ error: 'AI service failed' }, 502)

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    const output = outputSchema.safeParse(JSON.parse(text))
    if (!output.success) {
      console.error('Invalid AI output:', text)
      return json({ error: 'AI returned invalid data' }, 502)
    }

    const { error: updateError } = await supabase
      .from('roadmap_topics')
      .update({ details: output.data })
      .eq('id', topic.id)
    if (updateError) {
      console.error('Update error:', updateError)
      return json({ error: 'Failed to save details' }, 500)
    }

    return json({ details: output.data })
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'Something went wrong' }, 500)
  }
})