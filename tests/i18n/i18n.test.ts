import { describe, it, expect } from 'vitest'
import { resolvePath, interpolate } from '@/lib/i18n'

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
