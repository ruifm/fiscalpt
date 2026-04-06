'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquareWarning, Send, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedbackButtonProps {
  stage: string
}

export function FeedbackButton({ stage }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setSending(true)
    try {
      await fetch('/api/report-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: message.trim(), stage }),
      })
    } catch {
      // Best-effort
    }
    setSending(false)
    setSent(true)
    setMessage('')
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setSent(false)
          setOpen(true)
        }}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-muted/90 text-muted-foreground shadow-lg ring-1 ring-border/50 backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground hover:scale-105 print:hidden"
        aria-label="Enviar feedback"
      >
        <MessageSquareWarning className="h-5 w-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-xl border bg-background shadow-2xl ring-1 ring-border/50 print:hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-semibold">Enviar feedback</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4">
        {sent ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <CheckCircle className="h-8 w-8 text-emerald-500" aria-hidden="true" />
            <p className="text-sm font-medium">Obrigado pelo seu feedback!</p>
            <p className="text-xs text-muted-foreground text-center">
              A sua mensagem foi enviada. Iremos analisar o mais brevemente possível.
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Algo não funciona como esperado? Descreva o problema ou sugestão.
            </p>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva o problema ou sugestão..."
              rows={3}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex items-center justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={sending || !message.trim()}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                {sending ? 'A enviar...' : 'Enviar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
