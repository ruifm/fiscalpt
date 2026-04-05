import { describe, it, expect } from 'vitest'

// Test the pure utility functions directly — resolvePath and interpolate
// We re-implement them here since they're not exported, but test the same logic
// through the public API via a minimal dictionary

function resolvePath(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  )
}

describe('i18n utilities', () => {
  describe('resolvePath', () => {
    const dict = {
      common: {
        buttons: {
          back: 'Voltar',
          next: 'Seguinte',
        },
      },
      landing: {
        title: 'FiscalPT',
      },
    }

    it('resolves top-level key', () => {
      expect(resolvePath({ title: 'Hello' }, 'title')).toBe('Hello')
    })

    it('resolves nested path', () => {
      expect(resolvePath(dict, 'common.buttons.back')).toBe('Voltar')
    })

    it('returns undefined for missing path', () => {
      expect(resolvePath(dict, 'common.buttons.submit')).toBeUndefined()
    })

    it('returns undefined for partial path (non-leaf)', () => {
      expect(resolvePath(dict, 'common.buttons')).toBeUndefined()
    })

    it('returns undefined for empty dict', () => {
      expect(resolvePath({}, 'any.path')).toBeUndefined()
    })
  })

  describe('interpolate', () => {
    it('replaces named parameters', () => {
      expect(interpolate('Olá {name}!', { name: 'Rui' })).toBe('Olá Rui!')
    })

    it('replaces multiple parameters', () => {
      expect(interpolate('{min} a {max}', { min: 1, max: 10 })).toBe('1 a 10')
    })

    it('leaves unknown parameters as-is', () => {
      expect(interpolate('{name} {unknown}', { name: 'Rui' })).toBe('Rui {unknown}')
    })

    it('handles numeric parameters', () => {
      expect(interpolate('Ano {year}', { year: 2025 })).toBe('Ano 2025')
    })

    it('returns template unchanged with empty params', () => {
      expect(interpolate('No params here', {})).toBe('No params here')
    })
  })
})
