import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type ChatMessageRow = Database['public']['Tables']['chat_messages']['Row']

export type ChatThread = Database['public']['Tables']['chat_threads']['Row']
export type ChatMessage = Omit<ChatMessageRow, 'role'> & { role: 'user' | 'assistant' }
export type ChatStyle = 'simple' | 'detailed' | 'code'

export async function getThreads() {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createThread(userId: string) {
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({ user_id: userId })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function getMessages(threadId: string) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as ChatMessage[]
}

// بنقرا الـ Stream بـ fetch لأن supabase.functions.invoke مش بيدعم البث
export async function streamMentorReply(
  input: { threadId: string; message: string; style: ChatStyle },
  onChunk: (text: string) => void,
) {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mentor-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        thread_id: input.threadId,
        message: input.message,
        style: input.style,
      }),
    },
  )
  if (res.status === 429) throw new Error('Daily limit reached. Try again tomorrow.')
  if (!res.ok || !res.body) throw new Error('Mentor request failed')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}