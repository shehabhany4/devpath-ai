import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  createThread,
  getMessages,
  getThreads,
  streamMentorReply,
  type ChatStyle,
} from './api'

const styles: { value: ChatStyle; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'code', label: 'Code examples' },
]

export function MentorPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [threadId, setThreadId] = useState<string | null>(null)
  const [style, setStyle] = useState<ChatStyle>('simple')
  const [input, setInput] = useState('')
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [streamed, setStreamed] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: threads = [] } = useQuery({ queryKey: ['threads'], queryFn: getThreads })
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => getMessages(threadId!),
    enabled: !!threadId,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamed, pendingUser])

  async function handleNewChat() {
    if (!user) return
    const thread = await createThread(user.id)
    await queryClient.invalidateQueries({ queryKey: ['threads'] })
    setThreadId(thread.id)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || !user || sending) return
    setError(null)
    setSending(true)
    setInput('')

    try {
      let id = threadId
      if (!id) {
        const thread = await createThread(user.id)
        id = thread.id
        setThreadId(id)
      }
      setPendingUser(text)
      setStreamed('')
      await streamMentorReply({ threadId: id, message: text, style }, (chunk) =>
        setStreamed((prev) => prev + chunk),
      )
      await queryClient.invalidateQueries({ queryKey: ['messages', id] })
      await queryClient.invalidateQueries({ queryKey: ['threads'] })
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setPendingUser(null)
      setStreamed('')
      setSending(false)
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-5xl gap-4 px-6 py-6">
      <aside className="hidden w-60 shrink-0 flex-col gap-2 sm:flex">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to dashboard
        </Link>
        <Button variant="outline" onClick={handleNewChat}>
          <Plus className="size-4" /> New chat
        </Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setThreadId(t.id)}
              className={`hover:bg-muted w-full truncate rounded-md px-3 py-2 text-left text-sm ${
                t.id === threadId ? 'bg-muted' : ''
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-2 pb-3">
          {styles.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={style === s.value ? 'default' : 'outline'}
              onClick={() => setStyle(s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="border-border bg-card flex-1 space-y-4 overflow-y-auto rounded-xl border p-4">
          {messages.length === 0 && !pendingUser && (
            <p className="text-muted-foreground text-sm">
              Ask me anything about programming.
            </p>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} text={m.content} />
          ))}
          {pendingUser && <Bubble role="user" text={pendingUser} />}
          {pendingUser && <Bubble role="assistant" text={streamed || '...'} />}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-destructive mt-2 text-sm">{error}</p>}

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your mentor..."
            maxLength={2000}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </section>
    </div>
  )
}

function Bubble({ role, text }: { role: 'user' | 'assistant'; text: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {text}
      </div>
    </div>
  )
}