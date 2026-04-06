'use client'

import { useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutFormProps {
  analysisId: string
  sessionHash?: string
  promotionCodeId?: string
  onComplete: (sessionId: string) => void
}

export function CheckoutForm({ analysisId, sessionHash, promotionCodeId, onComplete }: CheckoutFormProps) {
  const [error, setError] = useState<string | null>(null)

  const fetchClientSecret = useCallback(async () => {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId, sessionHash, promotionCodeId }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        const msg = data.error ?? 'Failed to create checkout session'
        setError(msg)
        throw new Error(msg)
      }

      const data = (await res.json()) as { clientSecret: string }
      return data.clientSecret
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar sessão de pagamento'
      setError(msg)
      throw err
    }
  }, [analysisId, sessionHash, promotionCodeId])

  if (!stripePromise) {
    return (
      <p className="text-sm text-muted-foreground">Pagamento não disponível. Contacte o suporte.</p>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{
        fetchClientSecret,
        onComplete: () => {
          const params = new URLSearchParams(window.location.search)
          const sessionId = params.get('session_id')
          if (sessionId) onComplete(sessionId)
        },
      }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
