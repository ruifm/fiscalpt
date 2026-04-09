import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { parseBody } from '@/lib/api-validation'

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function invalidJsonRequest(): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json{{{',
  })
}

const schema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
})

describe('parseBody', () => {
  it('returns parsed data for valid input', async () => {
    const result = await parseBody(jsonRequest({ name: 'Alice', age: 30 }), schema)
    expect(result).toEqual({ ok: true, data: { name: 'Alice', age: 30 } })
  })

  it('strips unknown fields (passthrough not enabled)', async () => {
    const result = await parseBody(jsonRequest({ name: 'Bob', extra: 'field' }), schema)
    expect(result).toEqual({ ok: true, data: { name: 'Bob' } })
  })

  it('returns 400 for invalid JSON', async () => {
    const result = await parseBody(invalidJsonRequest(), schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toBe('Invalid JSON')
    }
  })

  it('returns 400 with field errors for schema violations', async () => {
    const result = await parseBody(jsonRequest({ name: '', age: -5 }), schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toBe('Invalid request')
      expect(body.details).toBeDefined()
      expect(body.details.name).toBeDefined()
    }
  })

  it('returns 400 when required field is missing', async () => {
    const result = await parseBody(jsonRequest({ age: 25 }), schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.details.name).toBeDefined()
    }
  })

  it('returns 400 for wrong type on field', async () => {
    const result = await parseBody(jsonRequest({ name: 123 }), schema)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.details.name).toBeDefined()
    }
  })

  it('accepts optional fields when absent', async () => {
    const result = await parseBody(jsonRequest({ name: 'Test' }), schema)
    expect(result).toEqual({ ok: true, data: { name: 'Test' } })
  })

  it('validates nested arrays', async () => {
    const result = await parseBody(jsonRequest({ name: 'Test', tags: ['a', 'b'] }), schema)
    expect(result).toEqual({ ok: true, data: { name: 'Test', tags: ['a', 'b'] } })
  })

  it('rejects invalid array items', async () => {
    const result = await parseBody(jsonRequest({ name: 'Test', tags: [1, 2] }), schema)
    expect(result.ok).toBe(false)
  })
})
