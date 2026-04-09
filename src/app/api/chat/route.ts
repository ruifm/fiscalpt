import { NextResponse } from 'next/server'
import { z } from 'zod'
import { streamChat, type ChatMessage } from '@/lib/llm'
import { buildChatSystemPrompt } from '@/lib/chat-context'
import type { AnalysisResult } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'
import type { Locale } from '@/lib/i18n'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'
import { parseBody } from '@/lib/api-validation'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().max(MAX_MESSAGE_LENGTH),
})

// Minimal shape validation for AnalysisResult — avoids replicating the full
// type system in Zod while ensuring the data has the expected structure.
const analysisResultSchema = z
  .object({
    year: z.number(),
    household: z.object({ year: z.number(), filing_status: z.string(), members: z.array(z.any()) }),
    scenarios: z.array(z.object({ label: z.string() }).passthrough()),
    recommended_scenario: z.string(),
    optimizations: z.array(z.object({ id: z.string() }).passthrough()),
  })
  .passthrough()

const actionableReportSchema = z
  .object({
    year: z.number(),
    recommendations: z.array(
      z.object({ id: z.string(), category: z.string(), total_savings: z.number() }).passthrough(),
    ),
    total_savings: z.number(),
  })
  .passthrough()

const schema = z.object({
  messages: z.array(messageSchema).min(1),
  results: z.array(analysisResultSchema).min(1),
  locale: z.string().optional(),
  recommendations: z.array(actionableReportSchema).optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = await parseBody(request, schema)
    if (!parsed.ok) return parsed.response

    const { messages, results, locale, recommendations } = parsed.data

    if (isRateLimited(rateLimitKey(request, 'chat'), { maxRequests: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const userMessages = messages.filter((m) => m.role === 'user')
    if (userMessages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: 'message_limit', limit: MAX_MESSAGES }, { status: 429 })
    }

    const systemPrompt = buildChatSystemPrompt({
      results: results as unknown as AnalysisResult[],
      locale: locale as Locale,
      recommendations: recommendations as unknown as ActionableReport[],
    })
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(chatMessages)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`))
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } catch (err) {
          console.error('[chat] Stream error:', err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`),
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    console.error('[chat] Error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
