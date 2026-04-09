import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { parseBody } from '@/lib/api-validation'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'
import type Stripe from 'stripe'

const schema = z.object({
  code: z
    .string()
    .min(1)
    .transform((s) => s.trim().toUpperCase()),
})

export async function POST(request: Request) {
  if (
    isRateLimited(rateLimitKey(request, 'discount-validate'), { maxRequests: 10, windowMs: 60_000 })
  )
    return Response.json({ error: 'Too many requests' }, { status: 429 })

  const parsed = await parseBody(request, schema)
  if (!parsed.ok) return parsed.response

  const { code } = parsed.data

  // Check Stripe promotion codes
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ['data.promotion.coupon'],
    })

    if (promotionCodes.data.length === 0) {
      return Response.json({ valid: false, message: 'Código inválido ou expirado' })
    }

    const promo = promotionCodes.data[0]

    // Check if max redemptions reached
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
      return Response.json({ valid: false, message: 'Código esgotado' })
    }

    // Check expiry
    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
      return Response.json({ valid: false, message: 'Código expirado' })
    }

    // Extract coupon from the promotion object
    const coupon =
      typeof promo.promotion !== 'string' && promo.promotion.type === 'coupon'
        ? (promo.promotion.coupon as Stripe.Coupon | null)
        : null

    if (!coupon || typeof coupon === 'string') {
      return Response.json({ valid: false, message: 'Código inválido' })
    }

    // Check coupon expiry
    if (coupon.redeem_by && coupon.redeem_by * 1000 < Date.now()) {
      return Response.json({ valid: false, message: 'Código expirado' })
    }

    const discountPercent = coupon.percent_off ?? null
    const discountAmount = coupon.amount_off ?? null

    return Response.json({
      valid: true,
      type: 'stripe' as const,
      promotion_code_id: promo.id,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      currency: coupon.currency,
      message: discountPercent === 100 ? 'Código gratuito aplicado' : 'Desconto aplicado',
    })
  } catch {
    return Response.json({ error: 'Erro ao validar código' }, { status: 500 })
  }
}
