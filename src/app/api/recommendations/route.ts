import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { generateActionableRecommendations } from '@/lib/tax/actionable-recommendations'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validation'

// Minimal shape validation for AnalysisResult — ensures data has expected structure
// without replicating the full type system in Zod.
const analysisResultSchema = z
  .object({
    year: z.number(),
    household: z.object({ year: z.number(), filing_status: z.string(), members: z.array(z.any()) }),
    scenarios: z.array(z.object({ label: z.string() }).passthrough()),
    recommended_scenario: z.string(),
    optimizations: z.array(z.object({ id: z.string() }).passthrough()),
  })
  .passthrough()

const schema = z.object({
  sessionId: z.string().min(1),
  results: z.array(analysisResultSchema).min(1),
})

export async function POST(request: Request) {
  if (
    isRateLimited(rateLimitKey(request, 'recommendations'), { maxRequests: 10, windowMs: 60_000 })
  ) {
    return Response.json({ error: 'Rate limited' }, { status: 429 })
  }

  const parsed = await parseBody(request, schema)
  if (!parsed.ok) return parsed.response

  const { sessionId, results } = parsed.data

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not verified' }, { status: 402 })
    }
  } catch {
    return Response.json({ error: 'Invalid session' }, { status: 402 })
  }

  // Generate actionable recommendations server-side
  const recommendations = (
    results as unknown as Parameters<typeof generateActionableRecommendations>[0][]
  ).map((result) => generateActionableRecommendations(result))

  return Response.json({ recommendations })
}
