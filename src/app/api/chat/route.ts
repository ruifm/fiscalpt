import { NextResponse } from 'next/server'
import { streamChat, type ChatMessage } from '@/lib/llm'
import type { AnalysisResult } from '@/lib/tax/types'
import { isRateLimited, rateLimitKey } from '@/lib/rate-limit'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LENGTH = 2000

interface ChatRequestBody {
  messages: { role: 'user' | 'assistant'; content: string }[]
  results: AnalysisResult[]
}

function buildSystemPrompt(results: AnalysisResult[]): string {
  // Redact PII: replace names with generic labels
  let memberIndex = 0
  const resultsSummary = JSON.stringify(
    results.map((r) => ({
      year: r.year,
      household: {
        filing_status: r.household.filing_status,
        members: r.household.members.map((m) => ({
          name: `Membro ${++memberIndex}`,
          incomes: m.incomes,
          deductions: m.deductions,
          special_regimes: m.special_regimes,
        })),
        dependents: r.household.dependents.map((d, i) => ({
          name: `Dependente ${i + 1}`,
          birth_year: d.birth_year,
        })),
      },
      scenarios: r.scenarios,
      recommended_scenario: r.recommended_scenario,
      optimizations: r.optimizations,
    })),
    null,
    2,
  )

  return `You are a Portuguese tax consultant AI assistant for FiscalPT.
You help individual taxpayers understand their tax situation based on a deterministic analysis that has already been computed by a verified tax engine.

CONTEXT:
- All numbers in the data below were computed by a deterministic tax engine — they are mathematically verified, not AI-generated.
- Your role is to EXPLAIN these results, not compute or modify them.
- Personal names have been redacted for privacy (shown as "Membro 1", "Membro 2", etc.).

CRITICAL RULES:
- You MUST only discuss the user's specific tax data provided below. Never invent numbers.
- You explain results — you do NOT compute taxes. The engine already did that.
- If the user asks about something not covered in their data, say so clearly.
- Be practical and actionable. Explain in simple language.
- Respond in the same language the user writes in (Portuguese or English).
- Keep responses concise — 2-3 paragraphs max unless the user asks for detail.
- Use € formatting (e.g., €1.234,56) for amounts.
- Reference specific values from the analysis when explaining.
- Never provide legal advice — you provide tax information and explain calculations.

USER'S TAX ANALYSIS DATA (PII redacted):
${resultsSummary}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const { messages, results } = body

    if (!messages || !results || !Array.isArray(messages) || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (isRateLimited(rateLimitKey(request, 'chat'), { maxRequests: 30, windowMs: 60_000 })) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
    }

    const userMessages = messages.filter((m) => m.role === 'user')
    if (userMessages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: 'message_limit', limit: MAX_MESSAGES }, { status: 429 })
    }

    if (messages.some((m) => m.content.length > MAX_MESSAGE_LENGTH)) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(results)
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
