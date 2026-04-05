import { describe, it, expect } from 'vitest'
import { computeSSEmployee, computeSSIndependent, computeTotalSS } from '@/lib/tax/social-security'
import type { Income } from '@/lib/tax/types'

describe('Social Security — Employee (Cat A)', () => {
  it('should compute 11% of gross', () => {
    expect(computeSSEmployee(30000)).toBe(3300)
  })

  it('should return 0 for zero income', () => {
    expect(computeSSEmployee(0)).toBe(0)
  })

  it('should handle typical salary (€1,500/month × 14)', () => {
    const annual = 1500 * 14
    expect(computeSSEmployee(annual)).toBe(2310) // 21,000 × 0.11
  })
})

describe('Social Security — Independent (Cat B)', () => {
  it('should compute without reduction: 70% × 21.4%', () => {
    // 30,000 × 0.70 × 0.214 = 4,494
    expect(computeSSIndependent(30000, false)).toBe(4494)
  })

  it('should compute with 75% reduction', () => {
    // 30,000 × 0.70 × 0.214 × 0.75 = 3,370.50
    expect(computeSSIndependent(30000, true)).toBe(3370.5)
  })

  it('effective rate without reduction should be ~14.98%', () => {
    const gross = 50000
    const ss = computeSSIndependent(gross, false)
    const effectiveRate = ss / gross
    expect(effectiveRate).toBeCloseTo(0.1498, 3)
  })
})

describe('Total SS Computation', () => {
  it('should use explicit ss_paid if provided', () => {
    const incomes: Income[] = [{ category: 'A', gross: 30000, ss_paid: 3000 }]
    expect(computeTotalSS(incomes)).toBe(3000)
  })

  it('should compute SS for Cat A and Cat B combined', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 25000 },
      { category: 'B', gross: 15000 },
    ]
    // Cat A: 25,000 × 0.11 = 2,750
    // Cat B: 15,000 × 0.70 × 0.214 = 2,247
    const expected = 2750 + 2247
    expect(computeTotalSS(incomes)).toBe(expected)
  })

  it('should not compute SS for Cat E, F, G, H', () => {
    const incomes: Income[] = [
      { category: 'E', gross: 10000 },
      { category: 'F', gross: 5000 },
    ]
    expect(computeTotalSS(incomes)).toBe(0)
  })
})
