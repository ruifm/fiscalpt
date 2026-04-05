import { isBypassCode } from '@/lib/bypass-codes'
import { stripe } from '@/lib/stripe'
import { generateActionableRecommendations } from '@/lib/tax/actionable-recommendations'
import type { AnalysisResult } from '@/lib/tax/types'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

interface RecommendationsRequest {
  sessionId?: string
  bypassCode?: string
  results: AnalysisResult[]
}

export async function POST(request: Request) {
  if (
    isRateLimited(rateLimitKey(request, 'recommendations'), { maxRequests: 10, windowMs: 60_000 })
  ) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  let body: RecommendationsRequest
  try {
    body = (await request.json()) as RecommendationsRequest
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.results?.length) {
    return Response.json({ error: 'Missing results' }, { status: 400 })
  }

  // Auth: bypass code OR Stripe payment
  const isBypassed = isBypassCode(body.bypassCode ?? '')

  if (!isBypassed) {
    if (!body.sessionId) {
      return Response.json({ error: 'Missing sessionId or bypassCode' }, { status: 400 })
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(body.sessionId)
      if (session.payment_status !== 'paid') {
        return Response.json({ error: 'Payment not verified' }, { status: 402 })
      }
    } catch {
      return Response.json({ error: 'Invalid session' }, { status: 402 })
    }
  }

  // Generate actionable recommendations server-side
  const recommendations = body.results.map((result) => generateActionableRecommendations(result))

  return Response.json({ recommendations })
}
