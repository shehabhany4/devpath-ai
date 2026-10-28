import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const inputSchema = z.object({
  goal: z.string().min(1).max(100),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daily_minutes: z.number().int().min(15).max(480),
})

const outputSchema = z.object({
  title: z.string().min(1),
  topics: z
    .array(z.object({ title: z.string().min(1), description: z.string().min(1) }))
    .min(3)
    .max(15),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1) تأكد إن المستخدم مسجّل دخول
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Unauthorized' }, 401)

    // 2) Validation للمدخلات
    const parsed = inputSchema.safeParse(await req.json())
    if (!parsed.success) return json({ error: 'Invalid input' }, 400)
    const { goal, level, daily_minutes } = parsed.data

    // 3) نادي Gemini
    const prompt = `Create a learning roadmap for someone who wants to become a ${goal}.
Level: ${level}. Available time: ${daily_minutes} minutes per day.
Return 6 to 10 ordered topics, from first to last.`

    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                topics: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      description: { type: 'STRING' },
                    },
                    required: ['title', 'description'],
                  },
                },
              },
              required: ['title', 'topics'],
            },
          },
        }),
      },
    )
    if (!geminiRes.ok) return json({ error: 'AI service failed' }, 502)

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    // 4) Validation لرد الـ AI قبل الحفظ
    const output = outputSchema.safeParse(JSON.parse(text))
    if (!output.success) return json({ error: 'AI returned invalid data' }, 502)

    // 5) احفظ في الـ Database (بصلاحيات المستخدم، فالـ RLS شغال)
    const { data: roadmap, error: roadmapError } = await supabase
      .from('roadmaps')
      .insert({ user_id: userData.user.id, title: output.data.title, goal })
      .select('id')
      .single()
    if (roadmapError) return json({ error: 'Failed to save roadmap' }, 500)

    const { error: topicsError } = await supabase.from('roadmap_topics').insert(
      output.data.topics.map((t, i) => ({
        roadmap_id: roadmap.id,
        position: i + 1,
        title: t.title,
        description: t.description,
      })),
    )
    if (topicsError) return json({ error: 'Failed to save topics' }, 500)

    return json({ roadmap_id: roadmap.id })
  } catch {
    return json({ error: 'Something went wrong' }, 500)
  }
})
