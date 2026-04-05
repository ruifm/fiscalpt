import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const APPLY_TO = process.env.REPORT_EMAIL ?? 'contact@fiscalpt.com'
const APPLY_FROM = process.env.REPORT_FROM ?? 'FiscalPT <noreply@fiscalpt.com>'

const MAX_CV_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

export async function POST(request: Request) {
  if (isRateLimited(rateLimitKey(request, 'apply'), { maxRequests: 3, windowMs: 60_000 })) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  try {
    const formData = await request.formData()
    const name = formData.get('name') as string | null
    const email = formData.get('email') as string | null
    const role = formData.get('role') as string | null
    const coverLetter = formData.get('coverLetter') as string | null
    const cv = formData.get('cv') as File | null

    if (!name || !email || !role || !coverLetter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (cv) {
      if (cv.size > MAX_CV_SIZE) {
        return NextResponse.json({ error: 'CV file too large (max 5 MB)' }, { status: 400 })
      }
      if (!ALLOWED_TYPES.has(cv.type)) {
        return NextResponse.json({ error: 'Invalid file type (PDF or DOCX only)' }, { status: 400 })
      }
    }

    const timestamp = new Date().toISOString()
    console.info('[apply]', { name, email, role, hasCv: !!cv, timestamp })

    if (RESEND_API_KEY) {
      const resend = new Resend(RESEND_API_KEY)

      const attachments: { content: Buffer; filename: string }[] = []
      if (cv) {
        const buffer = Buffer.from(await cv.arrayBuffer())
        attachments.push({ content: buffer, filename: cv.name })
      }

      await resend.emails.send({
        from: APPLY_FROM,
        to: APPLY_TO,
        replyTo: email,
        subject: `[FiscalPT] Candidatura: ${role} — ${name}`,
        text: [
          `Nova candidatura — FiscalPT Carreiras`,
          ``,
          `Nome: ${name}`,
          `Email: ${email}`,
          `Posição: ${role}`,
          `Data: ${timestamp}`,
          `CV anexado: ${cv ? `${cv.name} (${(cv.size / 1024).toFixed(0)} KB)` : 'Não'}`,
          ``,
          `Carta de motivação:`,
          `─────────────────────`,
          coverLetter,
        ].join('\n'),
        attachments,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[apply] Failed to process application:', err)
    return NextResponse.json({ ok: true })
  }
}
