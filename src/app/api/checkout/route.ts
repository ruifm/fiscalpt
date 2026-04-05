import { stripe, RECOMMENDATIONS_PRICE_ID } from '@/lib/stripe'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

const ALLOWED_ORIGINS = new Set(
  [process.env.NEXT_PUBLIC_SITE_URL, 'http://localhost:3000', 'http://localhost:8080'].filter(
    Boolean,
  ),
)

function safeOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? ''
  if (ALLOWED_ORIGINS.has(origin)) return origin
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

export async function POST(request: Request) {
  const origin = safeOrigin(request)

  if (isRateLimited(rateLimitKey(request, 'checkout'), { maxRequests: 5, windowMs: 60_000 })) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as { analysisId?: string }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          price: RECOMMENDATIONS_PRICE_ID,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        analysis_id: body.analysisId ?? '',
      },
      return_url: `${origin}/analyze?session_id={CHECKOUT_SESSION_ID}`,
    })

    return Response.json({ clientSecret: session.client_secret })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
