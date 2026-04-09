import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

const querySchema = z.object({
  session_id: z.string().min(1, 'Missing session_id'),
})

export async function GET(request: Request) {
  if (
    isRateLimited(rateLimitKey(request, 'checkout-verify'), { maxRequests: 20, windowMs: 60_000 })
  )
    return Response.json({ error: 'Too many requests' }, { status: 429 })

  const url = new URL(request.url)
  const parsed = querySchema.safeParse({ session_id: url.searchParams.get('session_id') })

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    )
  }

  const { session_id: sessionId } = parsed.data

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return Response.json(
        { error: 'Payment not completed', status: session.payment_status },
        { status: 402 },
      )
    }

    return Response.json({
      paid: true,
      analysisId: session.metadata?.analysis_id ?? '',
    })
  } catch (err) {
    console.error('[checkout/verify] Error:', err)
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
