import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    throw new Error('Sentry server-side test error')
  } catch (e) {
    Sentry.captureException(e)
    await Sentry.flush(2000)
    return NextResponse.json({ ok: true, message: 'Error sent to Sentry' })
  }
}
