'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import {
  Lock,
  Unlock,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Tag,
  MessageSquareWarning,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { AnalysisResult } from '@/lib/tax/types'
import type {
  ActionableReport,
  ActionableRecommendation,
} from '@/lib/tax/actionable-recommendations'

const CheckoutForm = dynamic(
  () => import('@/components/checkout-form').then((mod) => mod.CheckoutForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
)

interface DiscountValidation {
  valid: boolean
  type?: 'bypass' | 'stripe'
  discount_percent?: number | null
  discount_amount?: number | null
  promotion_code_id?: string
  message?: string
}

interface RecommendationsPaywallProps {
  results: AnalysisResult[]
  totalSavings: number
  onUnlock?: (reports: ActionableReport[]) => void
  checkoutSessionId?: string | null
  chatSlot?: React.ReactNode
}

export function RecommendationsPaywall({
  results,
  totalSavings,
  onUnlock,
  checkoutSessionId,
  chatSlot,
}: RecommendationsPaywallProps) {
  const [showCheckout, setShowCheckout] = useState(false)
  const [recommendations, setRecommendations] = useState<ActionableReport[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountStatus, setDiscountStatus] = useState<{
    checking: boolean
    result: DiscountValidation | null
    error: string | null
  }>({ checking: false, result: null, error: null })
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const discountInputRef = useRef<HTMLInputElement>(null)

  const analysisId = `${results[0]?.year}-${Date.now()}`

  useEffect(() => {
    if (checkoutSessionId) {
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
      handlePaymentComplete(checkoutSessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (showDiscountInput) discountInputRef.current?.focus()
  }, [showDiscountInput])

  const handlePaymentComplete = useCallback(
    async (sessionId: string) => {
      setLoading(true)
      setError(null)
      setShowCheckout(false)

      try {
        const verifyRes = await fetch(`/api/checkout/verify?session_id=${sessionId}`)
        if (!verifyRes.ok) throw new Error('Pagamento não verificado')

        const recRes = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, results }),
        })
        if (!recRes.ok) throw new Error('Erro ao gerar recomendações')

        const data = (await recRes.json()) as { recommendations: ActionableReport[] }
        setRecommendations(data.recommendations)
        onUnlock?.(data.recommendations)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    },
    [results, onUnlock],
  )

  const handleBypassUnlock = useCallback(
    async (code: string) => {
      setLoading(true)
      setError(null)

      try {
        const recRes = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bypassCode: code, results }),
        })
        if (!recRes.ok) throw new Error('Erro ao gerar recomendações')

        const data = (await recRes.json()) as { recommendations: ActionableReport[] }
        setRecommendations(data.recommendations)
        onUnlock?.(data.recommendations)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    },
    [results, onUnlock],
  )

  const validateDiscount = useCallback(async () => {
    const code = discountCode.trim()
    if (!code) return

    setDiscountStatus({ checking: true, result: null, error: null })

    try {
      const res = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const data = (await res.json()) as DiscountValidation & { error?: string }

      if (!res.ok) {
        setDiscountStatus({ checking: false, result: null, error: data.error ?? 'Erro' })
        return
      }

      if (data.valid && (data.type === 'bypass' || data.discount_percent === 100)) {
        setDiscountStatus({ checking: false, result: data, error: null })
        await handleBypassUnlock(code)
        return
      }

      setDiscountStatus({ checking: false, result: data, error: null })
    } catch {
      setDiscountStatus({ checking: false, result: null, error: 'Erro ao validar código' })
    }
  }, [discountCode, handleBypassUnlock])

  if (totalSavings <= 0) return null

  if (recommendations) {
    return <RecommendationsDisplay reports={recommendations} chatSlot={chatSlot} />
  }

  if (loading) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-center gap-3 py-12">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            A gerar as suas recomendações...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setError(null)}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (showCheckout) {
    return (
      <Card className="border-primary/30">
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="font-semibold">Desbloquear Recomendações</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>
              Cancelar
            </Button>
          </div>
          <CheckoutForm analysisId={analysisId} onComplete={handlePaymentComplete} />
        </CardContent>
      </Card>
    )
  }

  const optimizationCount = results.reduce((sum, r) => sum + r.optimizations.length, 0)
  const hasValidPartialDiscount =
    discountStatus.result?.valid &&
    discountStatus.result.type === 'stripe' &&
    (discountStatus.result.discount_percent ?? 0) < 100

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent print:hidden">
      <CardContent className="py-8 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold">Recomendações Personalizadas</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Identificámos{' '}
            <span className="font-semibold text-foreground">
              {optimizationCount} {optimizationCount === 1 ? 'otimização' : 'otimizações'}
            </span>{' '}
            para o seu agregado. Desbloqueie o guia passo-a-passo para implementar cada uma.
          </p>
        </div>

        <ul className="text-sm text-muted-foreground space-y-1.5 max-w-xs mx-auto text-left">
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            Instruções passo-a-passo no Portal das Finanças
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            Impacto estimado de cada alteração
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            Links diretos para os formulários relevantes
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            Consultor fiscal AI para tirar dúvidas
          </li>
        </ul>

        <Button size="lg" className="gap-2" onClick={() => setShowCheckout(true)}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {hasValidPartialDiscount
            ? `Desbloquear com desconto de ${discountStatus.result!.discount_percent}%`
            : 'Desbloquear por €9,99'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>

        {/* Discount code */}
        <div className="space-y-2">
          {!showDiscountInput ? (
            <button
              type="button"
              onClick={() => setShowDiscountInput(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              <Tag className="inline h-3 w-3 mr-1" aria-hidden="true" />
              Tem um código de desconto?
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <label htmlFor="discount-code" className="sr-only">
                Código de desconto
              </label>
              <input
                ref={discountInputRef}
                id="discount-code"
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value)
                  setDiscountStatus({ checking: false, result: null, error: null })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') validateDiscount()
                }}
                placeholder="Código de desconto"
                className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={validateDiscount}
                disabled={discountStatus.checking || !discountCode.trim()}
              >
                {discountStatus.checking ? '...' : 'Aplicar'}
              </Button>
            </div>
          )}

          {discountStatus.error && (
            <p className="text-xs text-destructive" role="alert">
              {discountStatus.error}
            </p>
          )}
          {discountStatus.result && !discountStatus.result.valid && (
            <p className="text-xs text-destructive" role="alert">
              {discountStatus.result.message}
            </p>
          )}
          {hasValidPartialDiscount && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400" role="status">
              ✓ {discountStatus.result!.message}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Pagamento único · Sem subscrição · Reembolso garantido se insatisfeito
        </p>
        <p className="text-[10px] text-muted-foreground/70">Powered by Stripe</p>
      </CardContent>
    </Card>
  )
}

// ─── Unlocked Recommendations Display ────────────────────────

function RecommendationsDisplay({
  reports,
  chatSlot,
}: {
  reports: ActionableReport[]
  chatSlot?: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Unlock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <h2 className="text-lg font-bold">Recomendações Personalizadas</h2>
      </div>

      {chatSlot}

      {reports.map((report) => (
        <div key={report.year} className="space-y-4">
          {reports.length > 1 && (
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ano {report.year}
            </h3>
          )}

          {report.recommendations.map((rec, idx) => (
            <RecommendationCard key={rec.id} recommendation={rec} index={idx} />
          ))}
        </div>
      ))}

      <ReportProblemForm />
    </div>
  )
}

function RecommendationCard({
  recommendation,
  index,
}: {
  recommendation: ActionableRecommendation
  index: number
}) {
  const priorityColor = {
    high: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }

  const priorityLabel = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  }

  const formatEuro = (n: number) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(n)

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {index + 1}
            </div>
            <div>
              <h4 className="font-semibold">{recommendation.title}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{recommendation.summary}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={priorityColor[recommendation.priority]}>
              {priorityLabel[recommendation.priority]}
            </Badge>
            {recommendation.total_savings > 0 && (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {formatEuro(recommendation.total_savings)}
              </span>
            )}
          </div>
        </div>

        <div className="ml-10 space-y-3">
          {recommendation.steps.map((step) => (
            <div key={step.order} className="flex gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium mt-0.5">
                {step.order}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {step.portal_path && (
                  <a
                    href={step.portal_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Abrir no Portal
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Report a Problem / Refund Request ───────────────────────

function ReportProblemForm() {
  const [expanded, setExpanded] = useState(false)
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !description.trim()) return

    setSending(true)
    try {
      await fetch('/api/report-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), description: description.trim() }),
      })
      setSent(true)
    } catch {
      // Best-effort — even if the API fails, show success
      // (the user can always email directly)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <Card className="border-muted">
        <CardContent className="py-5 text-center space-y-2">
          <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium">Mensagem enviada</p>
          <p className="text-xs text-muted-foreground">
            Iremos analisar a sua situação e responder por email em breve.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!expanded) {
    return (
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          <MessageSquareWarning className="h-3.5 w-3.5" aria-hidden="true" />
          As recomendações não são aplicáveis? Reportar um problema
        </button>
      </div>
    )
  }

  return (
    <Card className="border-muted">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h4 className="text-sm font-semibold">Reportar um problema</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Se as recomendações não são aplicáveis à sua situação ou contêm erros, descreva o problema
          abaixo. Analisaremos o caso e, se justificado, processaremos o reembolso.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="report-email" className="text-xs font-medium">
              Email de contacto
            </label>
            <input
              id="report-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label htmlFor="report-description" className="text-xs font-medium">
              Descrição do problema
            </label>
            <textarea
              id="report-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva porque as recomendações não são aplicáveis à sua situação..."
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <Button
              type="submit"
              size="sm"
              disabled={sending || !email.trim() || !description.trim()}
              className="gap-1.5"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              {sending ? 'A enviar...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
