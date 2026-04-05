/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window per key (IP or session ID).
 *
 * NOT suitable for distributed deployments — use a Redis-based
 * solution if scaling to multiple instances.
 */
const buckets = new Map<string, number[]>()

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60_000
let lastCleanup = Date.now()

function cleanup(windowMs: number): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, timestamps] of buckets) {
    const recent = timestamps.filter((ts) => now - ts < windowMs)
    if (recent.length === 0) buckets.delete(key)
    else buckets.set(key, recent)
  }
}

export function isRateLimited(key: string, { maxRequests = 10, windowMs = 60_000 } = {}): boolean {
  cleanup(windowMs)
  const now = Date.now()
  const timestamps = (buckets.get(key) ?? []).filter((ts) => now - ts < windowMs)

  if (timestamps.length >= maxRequests) {
    buckets.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  buckets.set(key, timestamps)
  return false
}

/**
 * Extract a rate-limit key from a request.
 * Uses X-Forwarded-For (Vercel/proxy) → X-Real-IP → fallback.
 */
export function rateLimitKey(request: Request, prefix: string): string {
  const xff = request.headers.get('x-forwarded-for')
  const ip = xff?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? 'unknown'
  return `${prefix}:${ip}`
}
