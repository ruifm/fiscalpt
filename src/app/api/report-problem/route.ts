import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const REPORT_TO = process.env.REPORT_EMAIL ?? 'contact@fiscalpt.com'
const REPORT_FROM = process.env.REPORT_FROM ?? 'FiscalPT <noreply@fiscalpt.com>'

export async function POST(request: Request) {
  if (isRateLimited(rateLimitKey(request, 'report'), { maxRequests: 3, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as {
      email?: string
      description?: string
      stage?: string
    }
    const { email, description, stage } = body

    if (!description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    console.info('[report-problem]', { email, description, stage, timestamp })

    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY)
      const replyTo = email?.trim() || undefined
      const sender = replyTo ? `utilizador (${replyTo})` : 'utilizador anónimo'
      await resend.emails.send({
        from: REPORT_FROM,
        to: REPORT_TO,
        ...(replyTo ? { replyTo } : {}),
        subject: `[FiscalPT] Feedback de ${sender}${stage ? ` (${stage})` : ''}`,
        text: [
          `Novo feedback em FiscalPT`,
          ``,
          ...(replyTo ? [`Email: ${replyTo}`] : []),
          ...(stage ? [`Etapa: ${stage}`] : []),
          `Data: ${timestamp}`,
          ``,
          `Mensagem:`,
          description,
        ].join('\n'),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[report-problem] Failed to send email:', err)
    // Still return success — user shouldn't be penalized for email failures
    return NextResponse.json({ ok: true })
  }
}
