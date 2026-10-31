import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite']

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const inputSchema = z.object({
  thread_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  style: z.enum(['simple', 'detailed', 'code']),
})

const styleInstructions = {
  simple: 'Explain simply, in short sentences, like to a beginner. Avoid jargon.',
  detailed: 'Explain in detail, step by step, covering the why and the edge cases.',
  code: 'Explain mainly through short, well-commented code examples with brief text.',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// نجرّب كل موديل لحد ما واحد يرد (قبل ما نبدأ نبعت للمتصفح)
async function openGeminiStream(body: string) {
  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': Deno.env.get('GEMINI_API_KEY')!,
          },
          body,
        },
      )
      if (res.ok && res.body) return res
      console.error('Gemini error:', model, res.status, await res.text())
      if (res.status !== 503 && res.status !== 429) break
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  return null
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
    const { thread_id, message, style } = parsed.data

    // الـ RLS بيضمن إن الـ thread بتاع المستخدم
    const { data: thread } = await supabase
      .from('chat_threads')
      .select('id, title')
      .eq('id', thread_id)
      .maybeSingle()
    if (!thread) return json({ error: 'Thread not found' }, 404)

    // آخر 10 رسايل كسياق
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const contents = [
      ...(history ?? []).reverse().map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ]

    const geminiBody = JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: `You are DevPath AI Mentor, a friendly programming tutor. ${styleInstructions[style]}
Answer only programming and tech-career questions. Reply in the same language as the user.`,
          },
        ],
      },
      contents,
    })

    const geminiRes = await openGeminiStream(geminiBody)
    if (!geminiRes) return json({ error: 'AI service failed' }, 502)

    // احفظ رسالة المستخدم، وسمّي المحادثة من أول رسالة
    await supabase.from('chat_messages').insert({ thread_id, role: 'user', content: message })
    if (thread.title === 'New chat') {
      await supabase
        .from('chat_threads')
        .update({ title: message.slice(0, 50) })
        .eq('id', thread_id)
    }

    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    let buffer = ''
    let fullText = ''

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data:')) continue
              try {
                const chunk = JSON.parse(line.slice(5).trim())
                const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  fullText += text
                  controller.enqueue(encoder.encode(text))
                }
              } catch {
                // سطر ناقص، نتجاهله
              }
            }
          }
          if (fullText) {
            await supabase
              .from('chat_messages')
              .insert({ thread_id, role: 'assistant', content: fullText })
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('Unhandled error:', err)
    return json({ error: 'Something went wrong' }, 500)
  }
})