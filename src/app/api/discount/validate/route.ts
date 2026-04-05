import { isBypassCode } from '@/lib/bypass-codes'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  let body: { code?: string }
  try {
    body = (await request.json()) as { code?: string }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const code = (body.code ?? '').trim().toUpperCase()
  if (!code) {
    return Response.json({ error: 'Missing code' }, { status: 400 })
  }

  // Check server-side bypass codes (hash-based comparison)
  if (isBypassCode(code)) {
    return Response.json({
      valid: true,
      type: 'bypass' as const,
      discount_percent: 100,
      message: 'Código de acesso total aplicado',
    })
  }

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
