import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────

vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    promotionCodes: {
      list: vi.fn(),
    },
  },
  RECOMMENDATIONS_PRICE_ID: 'price_test_123',
}))

vi.mock('@/lib/rate-limit', () => ({
  isRateLimited: vi.fn(() => false),
  rateLimitKey: vi.fn((_req: unknown, prefix: string) => `test:${prefix}`),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email_123' }) },
  })),
}))

vi.mock('@/lib/llm', () => ({
  streamChat: vi.fn(async function* () {
    yield 'Hello'
    yield ' world'
  }),
}))

vi.mock('@/lib/chat-context', () => ({
  buildChatSystemPrompt: vi.fn(() => 'system prompt'),
}))

import { stripe } from '@/lib/stripe'
import { isRateLimited } from '@/lib/rate-limit'

// Reset rate limiter default between all tests
beforeEach(() => {
  vi.mocked(isRateLimited).mockReturnValue(false)
})

// ─── Helpers ──────────────────────────────────────────────────

/** Minimal mock result that passes AnalysisResult Zod validation */
const mockResult = {
  year: 2024,
  household: { year: 2024, filing_status: 'single', members: [] },
  scenarios: [{ label: 'Separada' }],
  recommended_scenario: 'Separada',
  optimizations: [],
}

function jsonRequest(url: string, body: unknown, headers?: Record<string, string>): Request {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

// ─── /api/checkout ────────────────────────────────────────────

describe('POST /api/checkout', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ POST } = await import('@/app/api/checkout/route'))
  })

  it('creates checkout session with valid input', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      client_secret: 'cs_test_secret',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/checkout', {
      analysisId: 'a1',
      sessionHash: 'abc',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.clientSecret).toBe('cs_test_secret')
  })

  it('accepts empty body (all fields optional)', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      client_secret: 'cs_no_args',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/checkout', {})
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = jsonRequest('http://localhost:3000/api/checkout', {})
    const res = await POST(req)
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toBe('Rate limited')
  })

  it('returns 500 when Stripe fails', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(new Error('Stripe down'))

    const req = jsonRequest('http://localhost:3000/api/checkout', {})
    const res = await POST(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Checkout failed')
  })

  it('passes promotionCodeId as discount', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      client_secret: 'cs_promo',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/checkout', {
      promotionCodeId: 'promo_abc',
    })
    await POST(req)

    const createCall = vi.mocked(stripe.checkout.sessions.create).mock.calls[0]?.[0]
    expect(createCall?.discounts).toEqual([{ promotion_code: 'promo_abc' }])
    expect(createCall?.allow_promotion_codes).toBeUndefined()
  })

  it('enables promotion codes when no promotionCodeId', async () => {
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      client_secret: 'cs_no_promo',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/checkout', {})
    await POST(req)

    const createCall = vi.mocked(stripe.checkout.sessions.create).mock.calls[0]?.[0]
    expect(createCall?.allow_promotion_codes).toBe(true)
    expect(createCall?.discounts).toBeUndefined()
  })
})

// ─── /api/checkout/verify ─────────────────────────────────────

describe('GET /api/checkout/verify', () => {
  let GET: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ GET } = await import('@/app/api/checkout/verify/route'))
  })

  it('returns paid status for completed session', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'paid',
      metadata: { analysis_id: 'a1' },
    } as never)

    const req = new Request('http://localhost:3000/api/checkout/verify?session_id=cs_test')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ paid: true, analysisId: 'a1' })
  })

  it('returns 402 for unpaid session', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'unpaid',
    } as never)

    const req = new Request('http://localhost:3000/api/checkout/verify?session_id=cs_test')
    const res = await GET(req)
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.error).toBe('Payment not completed')
  })

  it('returns 400 when session_id is missing', async () => {
    const req = new Request('http://localhost:3000/api/checkout/verify')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when Stripe throws', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValue(new Error('Stripe error'))

    const req = new Request('http://localhost:3000/api/checkout/verify?session_id=cs_bad')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Verification failed')
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = new Request('http://localhost:3000/api/checkout/verify?session_id=cs_test')
    const res = await GET(req)
    expect(res.status).toBe(429)
  })
})

// ─── /api/webhook ─────────────────────────────────────────────

describe('POST /api/webhook', () => {
  let POST: (req: Request) => Promise<Response>
  const origEnv = process.env.STRIPE_WEBHOOK_SECRET

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    ;({ POST } = await import('@/app/api/webhook/route'))
  })

  afterEach(() => {
    if (origEnv === undefined) delete process.env.STRIPE_WEBHOOK_SECRET
    else process.env.STRIPE_WEBHOOK_SECRET = origEnv
  })

  it('returns 400 when signature is missing', async () => {
    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Missing signature')
  })

  it('handles checkout.session.completed event', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'sess_123', metadata: { analysis_id: 'a1' } } },
    } as never)

    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{"type":"checkout.session.completed"}',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.received).toBe(true)
  })

  it('returns 400 for invalid signature', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'bad_sig' },
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid signature')
  })

  it('handles unknown event types gracefully', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.created',
      data: { object: {} },
    } as never)

    const req = new Request('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).received).toBe(true)
  })
})

// ─── /api/report-problem ─────────────────────────────────────

describe('POST /api/report-problem', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ POST } = await import('@/app/api/report-problem/route'))
  })

  it('returns ok with valid description', async () => {
    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      description: 'Something is broken',
      email: 'user@example.com',
      stage: 'results',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  it('returns ok with minimal body (description only)', async () => {
    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      description: 'Bug report',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('returns 400 when description is missing', async () => {
    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      email: 'user@example.com',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when description is empty', async () => {
    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      description: '',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      description: 'test',
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns ok even when email sending fails', async () => {
    // Email failures should not penalize the user
    const { Resend } = await import('resend')
    vi.mocked(Resend).mockImplementation(
      () =>
        ({
          emails: { send: vi.fn().mockRejectedValue(new Error('SMTP error')) },
        }) as never,
    )

    const req = jsonRequest('http://localhost:3000/api/report-problem', {
      description: 'test report',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

// ─── /api/discount/validate ──────────────────────────────────

describe('POST /api/discount/validate', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ POST } = await import('@/app/api/discount/validate/route'))
  })

  it('returns valid discount for active promo code', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({
      data: [
        {
          id: 'promo_abc',
          max_redemptions: 100,
          times_redeemed: 5,
          expires_at: null,
          promotion: {
            type: 'coupon',
            coupon: {
              percent_off: 50,
              amount_off: null,
              currency: 'eur',
              redeem_by: null,
            },
          },
        },
      ],
    } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'SAVE50' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.discount_percent).toBe(50)
    expect(json.promotion_code_id).toBe('promo_abc')
    expect(json.message).toBe('Desconto aplicado')
  })

  it('returns free message for 100% discount', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({
      data: [
        {
          id: 'promo_free',
          max_redemptions: null,
          times_redeemed: 0,
          expires_at: null,
          promotion: {
            type: 'coupon',
            coupon: { percent_off: 100, amount_off: null, currency: 'eur', redeem_by: null },
          },
        },
      ],
    } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'FREE' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valid).toBe(true)
    expect(json.message).toBe('Código gratuito aplicado')
  })

  it('returns invalid for unknown code', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({ data: [] } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'INVALID' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.message).toContain('inválido')
  })

  it('returns invalid when max redemptions reached', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({
      data: [
        {
          id: 'promo_full',
          max_redemptions: 10,
          times_redeemed: 10,
          expires_at: null,
          promotion: {
            type: 'coupon',
            coupon: { percent_off: 50, amount_off: null, currency: 'eur', redeem_by: null },
          },
        },
      ],
    } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'FULL' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.message).toBe('Código esgotado')
  })

  it('returns invalid for expired promo code', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({
      data: [
        {
          id: 'promo_expired',
          max_redemptions: null,
          times_redeemed: 0,
          expires_at: Math.floor(Date.now() / 1000) - 3600, // expired 1h ago
          promotion: {
            type: 'coupon',
            coupon: { percent_off: 50, amount_off: null, currency: 'eur', redeem_by: null },
          },
        },
      ],
    } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'EXPIRED' })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.message).toBe('Código expirado')
  })

  it('returns invalid for expired coupon', async () => {
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({
      data: [
        {
          id: 'promo_coupon_expired',
          max_redemptions: null,
          times_redeemed: 0,
          expires_at: null,
          promotion: {
            type: 'coupon',
            coupon: {
              percent_off: 50,
              amount_off: null,
              currency: 'eur',
              redeem_by: Math.floor(Date.now() / 1000) - 3600,
            },
          },
        },
      ],
    } as never)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', {
      code: 'COUPON_EXPIRED',
    })
    const res = await POST(req)
    const json = await res.json()
    expect(json.valid).toBe(false)
    expect(json.message).toBe('Código expirado')
  })

  it('returns 400 for missing code', async () => {
    const req = jsonRequest('http://localhost:3000/api/discount/validate', {})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 500 when Stripe throws', async () => {
    vi.mocked(stripe.promotionCodes.list).mockRejectedValue(new Error('Stripe error'))

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'TEST' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = jsonRequest('http://localhost:3000/api/discount/validate', { code: 'TEST' })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})

// ─── /api/recommendations ─────────────────────────────────────

describe('POST /api/recommendations', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ POST } = await import('@/app/api/recommendations/route'))
  })

  it('returns recommendations for paid session', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'paid',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      sessionId: 'cs_test',
      results: [
        {
          year: 2024,
          household: {
            year: 2024,
            filing_status: 'single',
            members: [
              {
                name: 'Test',
                incomes: [{ category: 'A', gross: 30000 }],
                deductions: [],
                special_regimes: [],
              },
            ],
            dependents: [],
          },
          scenarios: [
            {
              label: 'Separada',
              filing_status: 'single',
              persons: [],
              total_gross: 30000,
              total_taxable: 25896,
              total_irs: 3650,
              total_ss: 3300,
              total_deductions: 850,
              total_tax_burden: 6950,
              total_net: 23050,
              effective_rate_irs: 0.12,
              effective_rate_total: 0.23,
            },
          ],
          recommended_scenario: 'Separada',
          optimizations: [],
        },
      ],
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.recommendations).toBeDefined()
    expect(Array.isArray(json.recommendations)).toBe(true)
  })

  it('returns 402 for unpaid session', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
      payment_status: 'unpaid',
    } as never)

    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      sessionId: 'cs_unpaid',
      results: [mockResult],
    })
    const res = await POST(req)
    expect(res.status).toBe(402)
  })

  it('returns 402 for invalid session ID', async () => {
    vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValue(new Error('Not found'))

    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      sessionId: 'cs_invalid',
      results: [mockResult],
    })
    const res = await POST(req)
    expect(res.status).toBe(402)
    const json = await res.json()
    expect(json.error).toBe('Invalid session')
  })

  it('returns 400 when sessionId is missing', async () => {
    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      results: [{ year: 2024 }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when results is empty', async () => {
    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      sessionId: 'cs_test',
      results: [],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = jsonRequest('http://localhost:3000/api/recommendations', {
      sessionId: 'cs_test',
      results: [mockResult],
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})

// ─── /api/chat ────────────────────────────────────────────────

describe('POST /api/chat', () => {
  let POST: (req: Request) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    ;({ POST } = await import('@/app/api/chat/route'))
  })

  it('returns SSE stream for valid chat request', async () => {
    const req = jsonRequest('http://localhost:3000/api/chat', {
      messages: [{ role: 'user', content: 'How much tax do I owe?' }],
      results: [mockResult],
      locale: 'pt',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('text/event-stream')

    const text = await res.text()
    expect(text).toContain('data: ')
    expect(text).toContain('[DONE]')
  })

  it('returns 400 when messages are missing', async () => {
    const req = jsonRequest('http://localhost:3000/api/chat', {
      results: [{ year: 2024 }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when results are missing', async () => {
    const req = jsonRequest('http://localhost:3000/api/chat', {
      messages: [{ role: 'user', content: 'test' }],
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(isRateLimited).mockReturnValue(true)

    const req = jsonRequest('http://localhost:3000/api/chat', {
      messages: [{ role: 'user', content: 'test' }],
      results: [mockResult],
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})
