'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, X, AlertCircle, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { AnalysisResult } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'
import { useT, useLocale } from '@/lib/i18n'

const MAX_MESSAGES = 20

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface TaxChatProps {
  results: AnalysisResult[]
  recommendations?: ActionableReport[]
}

export function TaxChat({ results, recommendations }: TaxChatProps) {
  const t = useT()
  const { locale } = useLocale()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const userMessageCount = messages.filter((m) => m.role === 'user').length

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || streaming || limitReached) return

    setInput('')
    setError(null)
    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, results, locale, recommendations }),
      })

      if (res.status === 429) {
        setLimitReached(true)
        setStreaming(false)
        return
      }

      if (!res.ok || !res.body) {
        throw new Error('Chat request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data) as { text?: string; error?: string }
            if (parsed.error) {
              setError(parsed.error)
              break
            }
            if (parsed.text) {
              assistantText += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantText }
                return updated
              })
            }
          } catch {
            // Ignore malformed SSE chunks
          }
        }
      }
    } catch {
      setError(t('chat.error'))
      setMessages((prev) => {
        if (
          prev.length > 0 &&
          prev[prev.length - 1].role === 'assistant' &&
          !prev[prev.length - 1].content
        ) {
          return prev.slice(0, -1)
        }
        return prev
      })
    } finally {
      setStreaming(false)
    }
  }, [input, streaming, limitReached, messages, results, locale, recommendations, t])

  return (
    <>
      {/* Inline CTA card — always visible in flow */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 print:hidden">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-bold">{t('chat.title')}</h3>
          </div>

          <p className="text-sm text-muted-foreground text-center max-w-md mx-auto">
            {t('chat.ctaDescription')}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {t('chat.trustEngine')}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" aria-hidden="true" />
              {t('chat.trustAi')}
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {t('chat.trustPrivacy')}
            </span>
          </div>

          {/* Suggestions as clickable chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {[t('chat.suggestion1'), t('chat.suggestion2'), t('chat.suggestion3')].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setInput(s)
                  setOpen(true)
                }}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                &ldquo;{s}&rdquo;
              </button>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" className="gap-2" onClick={() => setOpen(true)}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {t('chat.openButton')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Chat overlay panel */}
      {open && (
        <div className="fixed inset-0 z-50 print:hidden flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
          <Card className="w-full sm:w-[min(480px,calc(100vw-2rem))] shadow-2xl border-primary/20 flex flex-col h-[min(650px,calc(100vh-2rem))] sm:rounded-xl rounded-t-xl rounded-b-none sm:my-4">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">{t('chat.title')}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  {userMessageCount}/{MAX_MESSAGES}
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={t('chat.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8 space-y-3">
                  <MessageCircle className="h-8 w-8 mx-auto opacity-30" aria-hidden="true" />
                  <p>{t('chat.welcome')}</p>
                  <div className="flex flex-col gap-1.5">
                    {[t('chat.suggestion1'), t('chat.suggestion2'), t('chat.suggestion3')].map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setInput(s)
                            inputRef.current?.focus()
                          }}
                          className="text-xs italic text-primary/70 hover:text-primary transition-colors"
                        >
                          &ldquo;{s}&rdquo;
                        </button>
                      ),
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 pt-2">
                    {t('chat.trustBanner')}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                    {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                      <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                </div>
              ))}

              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              {limitReached && (
                <div className="text-center text-xs text-muted-foreground py-2">
                  <p>{t('chat.limitReached', { limit: MAX_MESSAGES })}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage()
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  disabled={streaming || limitReached}
                  placeholder={limitReached ? t('chat.limitPlaceholder') : t('chat.placeholder')}
                  rows={1}
                  className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 max-h-24 overflow-y-auto"
                  aria-label={t('chat.inputLabel')}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={streaming || limitReached || !input.trim()}
                  className="shrink-0 h-9 w-9"
                  aria-label={t('chat.send')}
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                {t('chat.disclaimer')}
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
