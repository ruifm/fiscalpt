import { stripe } from '@/lib/stripe'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id')

  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 })
  }

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
