import { z } from 'zod'
import { stripe, RECOMMENDATIONS_PRICE_ID } from '@/lib/stripe'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validation'

function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

const ALLOWED_ORIGINS = new Set(
  [siteUrl(), 'http://localhost:3000', 'http://localhost:8080'].filter(Boolean),
)

function safeOrigin(request: Request): string {
  const origin = request.headers.get('origin') ?? ''
  if (ALLOWED_ORIGINS.has(origin)) return origin
  // In development, allow any HTTP origin (LAN access on any port)
  if (process.env.NODE_ENV === 'development' && origin) {
    try {
      const url = new URL(origin)
      if (url.protocol === 'http:') return origin
    } catch {
      /* invalid origin — fall through */
    }
  }
  return siteUrl()
}

const ALLOWED_RETURN_PATHS = new Set(['/analyze', '/simulacao'])

const schema = z.object({
  analysisId: z.string().optional(),
  sessionHash: z.string().optional(),
  promotionCodeId: z.string().optional(),
  returnPath: z
    .string()
    .optional()
    .refine((v) => !v || ALLOWED_RETURN_PATHS.has(v), 'Invalid return path'),
})

export async function POST(request: Request) {
  const origin = safeOrigin(request)

  if (isRateLimited(rateLimitKey(request, 'checkout'), { maxRequests: 5, windowMs: 60_000 })) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  try {
    const parsed = await parseBody(request, schema)
    if (!parsed.ok) return parsed.response

    const body = parsed.data
    const hash = body.sessionHash ? `#s=${body.sessionHash}` : ''
    const returnPath = body.returnPath ?? '/analyze'
    // Build return URL manually — URL.searchParams.set() encodes braces,
    // which breaks Stripe's {CHECKOUT_SESSION_ID} template variable.
    const separator = returnPath.includes('?') ? '&' : '?'
    const returnUrl = `${origin}${returnPath}${separator}session_id={CHECKOUT_SESSION_ID}${hash}`

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      ui_mode: 'embedded_page',
      mode: 'payment',
      line_items: [
        {
          price: RECOMMENDATIONS_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        analysis_id: body.analysisId ?? '',
      },
      return_url: returnUrl,
    }

    // Pre-apply validated promo code, otherwise let user enter one in Stripe UI
    if (body.promotionCodeId) {
      sessionParams.discounts = [{ promotion_code: body.promotionCodeId }]
    } else {
      sessionParams.allow_promotion_codes = true
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return Response.json({ clientSecret: session.client_secret })
  } catch (err) {
    console.error('[checkout] Error:', err)
    return Response.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
