import { describe, it, expect } from 'vitest'
import {
  getIas,
  getRmmg,
  getMinimoExistencia,
  getPensaoMinimaAnual,
  getSpecificDeduction,
  IAS,
  RMMG,
  MINIMO_EXISTENCIA,
  PENSAO_MINIMA_ANUAL,
} from '@/lib/tax/types'

describe('Year-keyed constant accessors — fallback for future years', () => {
  describe('getIas', () => {
    it('returns exact value for supported years', () => {
      expect(getIas(2024)).toBe(509.26)
      expect(getIas(2025)).toBe(522.5)
    })

    it('falls back to latest year for future years', () => {
      expect(getIas(2026)).toBe(IAS[2025])
      expect(getIas(2030)).toBe(IAS[2025])
    })

    it('falls back to earliest year for years before data', () => {
      expect(getIas(2019)).toBe(IAS[2021])
    })
  })

  describe('getRmmg', () => {
    it('returns exact value for supported years', () => {
      expect(getRmmg(2025)).toBe(870.0)
    })

    it('falls back to latest year for future years', () => {
      expect(getRmmg(2026)).toBe(RMMG[2025])
    })
  })

  describe('getMinimoExistencia', () => {
    it('returns exact value for supported years', () => {
      expect(getMinimoExistencia(2025)).toBe(12180.0)
    })

    it('falls back to latest year for future years', () => {
      expect(getMinimoExistencia(2026)).toBe(MINIMO_EXISTENCIA[2025])
    })
  })

  describe('getPensaoMinimaAnual', () => {
    it('returns exact value for supported years', () => {
      expect(getPensaoMinimaAnual(2025)).toBe(3981.48)
    })

    it('falls back to latest year for future years', () => {
      expect(getPensaoMinimaAnual(2026)).toBe(PENSAO_MINIMA_ANUAL[2025])
    })
  })

  describe('getSpecificDeduction', () => {
    it('returns exact value for supported years', () => {
      expect(getSpecificDeduction(2025)).toBe(4462.15)
    })

    it('falls back to latest year for future years', () => {
      expect(getSpecificDeduction(2026)).toBe(4462.15)
    })

    it('returns 4104 default for years before data', () => {
      expect(getSpecificDeduction(2019)).toBe(4104)
    })
  })
})
