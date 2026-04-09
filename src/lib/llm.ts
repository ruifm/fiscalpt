import type OpenAI from 'openai'

// ─── Provider configuration ──────────────────────────────────

export type LlmProvider = 'github' | 'openai' | 'anthropic'

interface ProviderConfig {
  client: OpenAI
  model: string
}

let _OpenAI: typeof import('openai').default | undefined

async function getOpenAI(): Promise<typeof import('openai').default> {
  if (!_OpenAI) {
    const mod = await import('openai')
    _OpenAI = mod.default
  }
  return _OpenAI
}

const MODELS: Record<LlmProvider, string> = {
  github: 'gpt-4o-mini',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
}

function detectProvider(): LlmProvider {
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.GITHUB_TOKEN) return 'github'
  throw new Error(
    'No LLM provider configured. Set GITHUB_TOKEN, OPENAI_API_KEY, or ANTHROPIC_API_KEY.',
  )
}

async function buildConfig(provider?: LlmProvider): Promise<ProviderConfig> {
  const p = provider ?? detectProvider()
  const OpenAICtor = await getOpenAI()

  switch (p) {
    case 'github':
      return {
        client: new OpenAICtor({
          baseURL: 'https://models.inference.ai.azure.com',
          apiKey: process.env.GITHUB_TOKEN!,
        }),
        model: process.env.LLM_MODEL ?? MODELS.github,
      }
    case 'openai':
      return {
        client: new OpenAICtor({
          apiKey: process.env.OPENAI_API_KEY!,
        }),
        model: process.env.LLM_MODEL ?? MODELS.openai,
      }
    case 'anthropic':
      return {
        client: new OpenAICtor({
          baseURL: 'https://api.anthropic.com/v1/',
          apiKey: process.env.ANTHROPIC_API_KEY!,
        }),
        model: process.env.LLM_MODEL ?? MODELS.anthropic,
      }
  }
}

// ─── Chat interface ──────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  provider?: LlmProvider
  maxTokens?: number
  temperature?: number
}

const DEFAULT_MAX_TOKENS = 1024
const DEFAULT_TEMPERATURE = 0.3

/**
 * Stream a chat completion. Returns an async iterable of text chunks.
 */
export async function* streamChat(
  messages: ChatMessage[],
  options: ChatOptions = {},
): AsyncGenerator<string> {
  const { client, model } = await buildConfig(options.provider)

  const stream = await client.chat.completions.create({
    model,
    messages,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    stream: true,
  })

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) yield text
  }
}

/**
 * Non-streaming chat completion. Returns the full response text.
 */
export async function chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<string> {
  const { client, model } = await buildConfig(options.provider)

  const response = await client.chat.completions.create({
    model,
    messages,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
  })

  return response.choices[0]?.message?.content ?? ''
}
