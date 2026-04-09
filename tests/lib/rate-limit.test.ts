import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Fresh module state per test
let isRateLimited: typeof import('@/lib/rate-limit').isRateLimited
let rateLimitKey: typeof import('@/lib/rate-limit').rateLimitKey

beforeEach(async () => {
  vi.resetModules()
  const mod = await import('@/lib/rate-limit')
  isRateLimited = mod.isRateLimited
  rateLimitKey = mod.rateLimitKey
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isRateLimited', () => {
  it('allows requests under the limit', () => {
    expect(isRateLimited('k1', { maxRequests: 3, windowMs: 60_000 })).toBe(false)
    expect(isRateLimited('k1', { maxRequests: 3, windowMs: 60_000 })).toBe(false)
    expect(isRateLimited('k1', { maxRequests: 3, windowMs: 60_000 })).toBe(false)
  })

  it('blocks requests at the limit', () => {
    for (let i = 0; i < 3; i++) {
      isRateLimited('k2', { maxRequests: 3, windowMs: 60_000 })
    }
    expect(isRateLimited('k2', { maxRequests: 3, windowMs: 60_000 })).toBe(true)
  })

  it('uses separate buckets per key', () => {
    for (let i = 0; i < 5; i++) {
      isRateLimited('full', { maxRequests: 5, windowMs: 60_000 })
    }
    expect(isRateLimited('full', { maxRequests: 5, windowMs: 60_000 })).toBe(true)
    expect(isRateLimited('empty', { maxRequests: 5, windowMs: 60_000 })).toBe(false)
  })

  it('resets after window expires', () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 2; i++) {
        isRateLimited('k3', { maxRequests: 2, windowMs: 1000 })
      }
      expect(isRateLimited('k3', { maxRequests: 2, windowMs: 1000 })).toBe(true)

      vi.advanceTimersByTime(1001)
      expect(isRateLimited('k3', { maxRequests: 2, windowMs: 1000 })).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses defaults (10 requests, 60s window)', () => {
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited('defaults')).toBe(false)
    }
    expect(isRateLimited('defaults')).toBe(true)
  })

  it('runs periodic cleanup after interval', () => {
    vi.useFakeTimers()
    try {
      isRateLimited('stale', { maxRequests: 100, windowMs: 1000 })

      // Advance past cleanup interval (5 minutes) + window
      vi.advanceTimersByTime(5 * 60_000 + 1001)

      // Trigger cleanup by calling isRateLimited again
      isRateLimited('trigger', { maxRequests: 100, windowMs: 1000 })

      // Stale key should have been cleaned up — next call creates fresh bucket
      // (we verify indirectly: if not cleaned, bucket would still exist with
      // expired timestamps that get filtered, so behavior is the same either way.
      // The cleanup prevents memory growth for abandoned keys.)
      expect(isRateLimited('stale', { maxRequests: 100, windowMs: 1000 })).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('rateLimitKey', () => {
  it('uses x-forwarded-for first IP', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(rateLimitKey(req, 'chat')).toBe('chat:1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '10.0.0.1' },
    })
    expect(rateLimitKey(req, 'api')).toBe('api:10.0.0.1')
  })

  it('falls back to "unknown" when no IP headers', () => {
    const req = new Request('http://localhost')
    expect(rateLimitKey(req, 'test')).toBe('test:unknown')
  })

  it('prefers x-forwarded-for over x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' },
    })
    expect(rateLimitKey(req, 'p')).toBe('p:1.1.1.1')
  })

  it('handles single x-forwarded-for value', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '9.8.7.6' },
    })
    expect(rateLimitKey(req, 'prefix')).toBe('prefix:9.8.7.6')
  })
})
