import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuiz, useSubmitQuiz } from './useQuiz'

export function QuizPage() {
  const { topicId = '' } = useParams()
  const { data: quiz, isLoading, error } = useQuiz(topicId)
  const submit = useSubmitQuiz()
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const backLink = (
    <Link
      to={`/roadmap/${topicId}`}
      className="text-muted-foreground hover:text-foreground text-sm"
    >
      ← Back to topic
    </Link>
  )

  if (isLoading)
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12" aria-busy="true">
        <p className="text-muted-foreground text-center text-sm">
          Generating your quiz, this may take a moment...
        </p>
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </main>
    )

  if (error || !quiz)
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        {backLink}
        <p className="text-destructive mt-6">Failed to load the quiz. Try again.</p>
      </main>
    )

  // صفحة النتيجة
  if (submit.data) {
    const { score, total, results } = submit.data
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        {backLink}
        <h1 className="mt-6 text-3xl font-bold">
          Your score: {score} / {total}
        </h1>
        <ol className="mt-8 space-y-4">
          {results.map((r, i) => (
            <li key={i} className="border-border bg-card rounded-xl border p-4">
              <div className="flex items-start gap-2">
                {r.is_correct ? (
                  <CheckCircle2 className="text-primary mt-0.5 size-5 shrink-0" />
                ) : (
                  <XCircle className="text-destructive mt-0.5 size-5 shrink-0" />
                )}
                <h2 className="font-semibold">{r.question}</h2>
              </div>
              {!r.is_correct && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Your answer: {r.options[r.selected_index]}
                </p>
              )}
              <p className="text-primary mt-1 text-sm">
                Correct answer: {r.options[r.correct_index]}
              </p>
              <p className="text-muted-foreground mt-2 text-sm">{r.explanation}</p>
            </li>
          ))}
        </ol>
      </main>
    )
  }

  const allAnswered = Object.keys(answers).length === quiz.questions.length

  function handleSubmit() {
    if (!quiz) return
    submit.mutate({
      quizId: quiz.quiz_id,
      answers: quiz.questions.map((_, i) => answers[i]),
    })
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {backLink}
      <h1 className="mt-6 text-3xl font-bold">Quiz</h1>

      <ol className="mt-8 space-y-6">
        {quiz.questions.map((q, qi) => (
          <li key={qi} className="border-border bg-card rounded-xl border p-4">
            <h2 className="font-semibold">{q.question}</h2>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm"
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {submit.isError && (
        <p className="text-destructive mt-4 text-sm">Something went wrong. Try again.</p>
      )}

      <Button
        className="mt-6 w-full"
        disabled={!allAnswered || submit.isPending}
        onClick={handleSubmit}
      >
        {submit.isPending ? 'Submitting...' : 'Submit answers'}
      </Button>
    </main>
  )
}