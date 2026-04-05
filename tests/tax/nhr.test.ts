import { describe, it, expect } from 'vitest'
import {
  isNhrActive,
  computeNhrTax,
  getNhrQualifyingIncome,
  getNhrNonQualifyingIncome,
} from '@/lib/tax/nhr'
import type { Income } from '@/lib/tax/types'

describe('NHR — Active Check', () => {
  it('should be active within 10-year window', () => {
    expect(isNhrActive(2020, 2025)).toBe(true)
    expect(isNhrActive(2020, 2029)).toBe(true)
  })

  it('should not be active after 10 years', () => {
    expect(isNhrActive(2015, 2025)).toBe(false)
  })

  it('should not be active before start year', () => {
    expect(isNhrActive(2026, 2025)).toBe(false)
  })

  it('should be active in start year (year 0)', () => {
    expect(isNhrActive(2025, 2025)).toBe(true)
  })

  it('should return false if undefined', () => {
    expect(isNhrActive(undefined, 2025)).toBe(false)
  })

  it('should return true when nhr_confirmed is true regardless of start year', () => {
    // No start year, but confirmed via Anexo L
    expect(isNhrActive(undefined, 2025, true)).toBe(true)
    // Even with an expired start year, confirmed overrides
    expect(isNhrActive(2010, 2025, true)).toBe(true)
  })

  it('should fall back to start year check when not confirmed', () => {
    expect(isNhrActive(2020, 2025, false)).toBe(true)
    expect(isNhrActive(2015, 2025, false)).toBe(false)
    expect(isNhrActive(undefined, 2025, false)).toBe(false)
  })
})

describe('NHR — Tax Computation', () => {
  it('should compute 20% on Cat A + Cat B income', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 50000 },
      { category: 'B', gross: 20000 },
    ]
    // (50,000 + 20,000) × 20% = 14,000
    expect(computeNhrTax(incomes)).toBe(14000)
  })

  it('should not include other categories', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 50000 },
      { category: 'E', gross: 10000 },
      { category: 'F', gross: 5000 },
    ]
    // Only Cat A: 50,000 × 20% = 10,000
    expect(computeNhrTax(incomes)).toBe(10000)
  })
})

describe('NHR — Income Splitting', () => {
  it('should correctly split qualifying and non-qualifying income', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 40000 },
      { category: 'B', gross: 10000 },
      { category: 'E', gross: 5000 },
      { category: 'F', gross: 3000 },
    ]
    expect(getNhrQualifyingIncome(incomes)).toBe(50000)
    expect(getNhrNonQualifyingIncome(incomes)).toBe(8000)
  })
})
