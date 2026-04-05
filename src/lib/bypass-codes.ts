import { createHash } from 'crypto'

/**
 * Verify bypass codes by comparing SHA-256 hashes.
 *
 * The env var BYPASS_CODE_HASHES stores comma-separated SHA-256 hex digests
 * of valid codes. The plaintext code never appears in source or config —
 * only the hash is stored. To add a new code, compute its hash:
 *
 *   echo -n "YOUR_CODE" | sha256sum
 *
 * Then append the hex digest to BYPASS_CODE_HASHES.
 *
 * Legacy: BYPASS_CODES (plaintext, comma-separated) is still supported
 * for migration but should be removed once all environments use hashes.
 */

const bypassHashes = new Set(
  (process.env.BYPASS_CODE_HASHES ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),
)

// Legacy plaintext support — hash them at startup so comparison is uniform
const legacyPlaintext = (process.env.BYPASS_CODES ?? '')
  .split(',')
  .map((c) => c.trim().toUpperCase())
  .filter(Boolean)

for (const code of legacyPlaintext) {
  bypassHashes.add(hashCode(code))
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export function isBypassCode(rawCode: string): boolean {
  const normalized = rawCode.trim().toUpperCase()
  if (!normalized) return false
  return bypassHashes.has(hashCode(normalized))
}
