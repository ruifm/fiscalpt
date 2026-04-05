import { createHash } from 'crypto'
import { describe, expect, it, vi, beforeEach } from 'vitest'

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

describe('bypass-codes', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function loadWithEnv(env: Record<string, string>) {
    vi.stubEnv('BYPASS_CODE_HASHES', env.BYPASS_CODE_HASHES ?? '')
    vi.stubEnv('BYPASS_CODES', env.BYPASS_CODES ?? '')
    const mod = await import('@/lib/bypass-codes')
    return mod.isBypassCode
  }

  it('rejects empty code', async () => {
    const isBypassCode = await loadWithEnv({})
    expect(isBypassCode('')).toBe(false)
    expect(isBypassCode('   ')).toBe(false)
  })

  it('matches code via BYPASS_CODE_HASHES', async () => {
    const hash = hashCode('MYCODE123')
    const isBypassCode = await loadWithEnv({ BYPASS_CODE_HASHES: hash })
    expect(isBypassCode('MYCODE123')).toBe(true)
    expect(isBypassCode('mycode123')).toBe(true) // case insensitive
    expect(isBypassCode('  MYCODE123  ')).toBe(true) // trimmed
    expect(isBypassCode('WRONG')).toBe(false)
  })

  it('supports multiple hashes', async () => {
    const h1 = hashCode('CODE1')
    const h2 = hashCode('CODE2')
    const isBypassCode = await loadWithEnv({ BYPASS_CODE_HASHES: `${h1},${h2}` })
    expect(isBypassCode('CODE1')).toBe(true)
    expect(isBypassCode('CODE2')).toBe(true)
    expect(isBypassCode('CODE3')).toBe(false)
  })

  it('supports legacy BYPASS_CODES (plaintext)', async () => {
    const isBypassCode = await loadWithEnv({ BYPASS_CODES: 'LEGACY1,LEGACY2' })
    expect(isBypassCode('LEGACY1')).toBe(true)
    expect(isBypassCode('legacy2')).toBe(true)
    expect(isBypassCode('NOPE')).toBe(false)
  })

  it('supports both env vars simultaneously', async () => {
    const hash = hashCode('HASHCODE')
    const isBypassCode = await loadWithEnv({
      BYPASS_CODE_HASHES: hash,
      BYPASS_CODES: 'PLAINCODE',
    })
    expect(isBypassCode('HASHCODE')).toBe(true)
    expect(isBypassCode('PLAINCODE')).toBe(true)
    expect(isBypassCode('OTHER')).toBe(false)
  })

  it('handles whitespace and empty entries in env vars', async () => {
    const hash = hashCode('CLEAN')
    const isBypassCode = await loadWithEnv({
      BYPASS_CODE_HASHES: ` ${hash} , , `,
      BYPASS_CODES: ' , SPACE , ',
    })
    expect(isBypassCode('CLEAN')).toBe(true)
    expect(isBypassCode('SPACE')).toBe(true)
  })

  it('rejects partial hash match', async () => {
    const hash = hashCode('SECRET')
    const isBypassCode = await loadWithEnv({ BYPASS_CODE_HASHES: hash.slice(0, 32) })
    expect(isBypassCode('SECRET')).toBe(false)
  })
})
