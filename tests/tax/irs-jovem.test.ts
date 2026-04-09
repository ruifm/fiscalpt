import { describe, it, expect } from 'vitest'
import {
  getIrsJovemExemptionRate,
  getIrsJovemCap,
  computeIrsJovemExemption,
  isEligibleForIrsJovem,
  getIrsJovemRegime,
  deriveIrsJovemBenefitYear,
} from '@/lib/tax/irs-jovem'
import type { Income } from '@/lib/tax/types'
import { IAS } from '@/lib/tax/types'

// ─── 2021 Regime (Lei 2/2020) — 3 years, Cat A only ─────────

describe('IRS Jovem — 2021 (Lei 2/2020)', () => {
  const year = 2021

  it('has 3 benefit years max', () => {
    const regime = getIrsJovemRegime(year)
    expect(regime!.maxBenefitYears).toBe(3)
    expect(regime!.catBEligible).toBe(false)
  })

  it('Y1: 30%, Y2: 20%, Y3: 10%', () => {
    expect(getIrsJovemExemptionRate(1, year)).toBe(0.3)
    expect(getIrsJovemExemptionRate(2, year)).toBe(0.2)
    expect(getIrsJovemExemptionRate(3, year)).toBe(0.1)
  })

  it('Y4+ returns 0 (only 3 years)', () => {
    expect(getIrsJovemExemptionRate(4, year)).toBe(0)
    expect(getIrsJovemExemptionRate(5, year)).toBe(0)
  })

  it('caps: Y1=7.5×IAS, Y2=5×IAS, Y3=2.5×IAS', () => {
    const ias = IAS[2021] // 438.81
    expect(getIrsJovemCap(1, year)).toBeCloseTo(7.5 * ias, 2)
    expect(getIrsJovemCap(2, year)).toBeCloseTo(5 * ias, 2)
    expect(getIrsJovemCap(3, year)).toBeCloseTo(2.5 * ias, 2)
  })

  it('Cat B income is NOT eligible in 2021', () => {
    const incomes: Income[] = [{ category: 'B', gross: 20000 }]
    const exemption = computeIrsJovemExemption(incomes, 1, year)
    expect(exemption).toBe(0) // Cat B not eligible in 2021
  })

  it('Cat A income IS eligible in 2021', () => {
    const incomes: Income[] = [{ category: 'A', gross: 20000, ss_paid: 2200 }]
    // Y1: 30% × 20000 = 6000, cap = 7.5 × 438.81 = 3291.075
    // Exemption = min(6000, 3291.075) = 3291.08 (rounded)
    const exemption = computeIrsJovemExemption(incomes, 1, year)
    expect(exemption).toBeCloseTo(3291.08, 1)
  })
})

// ─── 2022-2023 Regime — 5 years, Cat A+B ────────────────────

describe('IRS Jovem — 2022-2023', () => {
  it('has 5 benefit years, Cat B eligible', () => {
    const regime = getIrsJovemRegime(2023)
    expect(regime!.maxBenefitYears).toBe(5)
    expect(regime!.catBEligible).toBe(true)
  })

  it('rates: Y1=50%, Y2=40%, Y3=30%, Y4=30%, Y5=20%', () => {
    expect(getIrsJovemExemptionRate(1, 2023)).toBe(0.5)
    expect(getIrsJovemExemptionRate(2, 2023)).toBe(0.4)
    expect(getIrsJovemExemptionRate(3, 2023)).toBe(0.3)
    expect(getIrsJovemExemptionRate(4, 2023)).toBe(0.3)
    expect(getIrsJovemExemptionRate(5, 2023)).toBe(0.2)
  })

  it('caps: 12.5/10/7.5/7.5/5 × IAS', () => {
    const ias = IAS[2023] // 480.43
    expect(getIrsJovemCap(1, 2023)).toBeCloseTo(12.5 * ias, 2)
    expect(getIrsJovemCap(2, 2023)).toBeCloseTo(10 * ias, 2)
    expect(getIrsJovemCap(3, 2023)).toBeCloseTo(7.5 * ias, 2)
    expect(getIrsJovemCap(5, 2023)).toBeCloseTo(5 * ias, 2)
  })

  it('exemption with Cat A+B income', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 15000, ss_paid: 1650 },
      { category: 'B', gross: 10000 },
    ]
    // Y1: 50% × (15000+10000) = 12500
    // Cap = 12.5 × 480.43 = 6005.375
    // Exemption = min(12500, 6005.375) = 6005.38
    const exemption = computeIrsJovemExemption(incomes, 1, 2023)
    expect(exemption).toBeCloseTo(6005.38, 1)
  })
})

// ─── 2024 Regime — 5 years, enhanced rates ──────────────────

describe('IRS Jovem — 2024 (Lei 82/2023)', () => {
  const year = 2024

  it('rates: Y1=100%, Y2=75%, Y3-4=50%, Y5=25%', () => {
    expect(getIrsJovemExemptionRate(1, year)).toBe(1.0)
    expect(getIrsJovemExemptionRate(2, year)).toBe(0.75)
    expect(getIrsJovemExemptionRate(3, year)).toBe(0.5)
    expect(getIrsJovemExemptionRate(4, year)).toBe(0.5)
    expect(getIrsJovemExemptionRate(5, year)).toBe(0.25)
  })

  it('caps: 40/30/20/20/10 × IAS', () => {
    const ias = IAS[2024] // 509.26
    expect(getIrsJovemCap(1, year)).toBeCloseTo(40 * ias, 2) // 20370.40
    expect(getIrsJovemCap(2, year)).toBeCloseTo(30 * ias, 2) // 15277.80
    expect(getIrsJovemCap(3, year)).toBeCloseTo(20 * ias, 2) // 10185.20
    expect(getIrsJovemCap(5, year)).toBeCloseTo(10 * ias, 2) // 5092.60
  })

  it('Y1 100% exemption capped', () => {
    const incomes: Income[] = [{ category: 'A', gross: 30000, ss_paid: 3300 }]
    // Y1: 100% × 30000 = 30000
    // Cap = 40 × 509.26 = 20370.40
    // Exemption = 20370.40
    const exemption = computeIrsJovemExemption(incomes, 1, year)
    expect(exemption).toBeCloseTo(20370.4, 1)
  })

  it('Y6+ returns 0 (only 5 years in 2024)', () => {
    expect(getIrsJovemExemptionRate(6, year)).toBe(0)
    expect(isEligibleForIrsJovem(6, year)).toBe(false)
  })
})

// ─── 2025 Regime (Lei 45-A/2024) — 10 years ────────────────

describe('IRS Jovem — 2025 (Lei 45-A/2024)', () => {
  const year = 2025

  it('has 10 benefit years, Cat B eligible', () => {
    const regime = getIrsJovemRegime(year)
    expect(regime!.maxBenefitYears).toBe(10)
    expect(regime!.catBEligible).toBe(true)
  })

  it('rates: Y1=100%, Y2-4=75%, Y5-7=50%, Y8-10=25%', () => {
    expect(getIrsJovemExemptionRate(1, year)).toBe(1.0)
    expect(getIrsJovemExemptionRate(2, year)).toBe(0.75)
    expect(getIrsJovemExemptionRate(3, year)).toBe(0.75)
    expect(getIrsJovemExemptionRate(4, year)).toBe(0.75)
    expect(getIrsJovemExemptionRate(5, year)).toBe(0.5)
    expect(getIrsJovemExemptionRate(6, year)).toBe(0.5)
    expect(getIrsJovemExemptionRate(7, year)).toBe(0.5)
    expect(getIrsJovemExemptionRate(8, year)).toBe(0.25)
    expect(getIrsJovemExemptionRate(9, year)).toBe(0.25)
    expect(getIrsJovemExemptionRate(10, year)).toBe(0.25)
  })

  it('all years capped at 55 × IAS = €28,737.50', () => {
    const expectedCap = 55 * IAS[2025] // 55 × 522.50 = 28737.50
    for (let y = 1; y <= 10; y++) {
      expect(getIrsJovemCap(y, year)).toBe(expectedCap)
    }
  })

  it('Y1 100% exemption under cap', () => {
    const incomes: Income[] = [{ category: 'A', gross: 20000, ss_paid: 2200 }]
    // Y1: 100% × 20000 = 20000, cap = 28737.50
    // Exemption = 20000
    const exemption = computeIrsJovemExemption(incomes, 1, year)
    expect(exemption).toBe(20000)
  })

  it('Y1 100% exemption hits cap', () => {
    const incomes: Income[] = [{ category: 'A', gross: 40000, ss_paid: 4400 }]
    // Y1: 100% × 40000 = 40000, cap = 28737.50
    // Exemption = 28737.50
    const exemption = computeIrsJovemExemption(incomes, 1, year)
    expect(exemption).toBe(28737.5)
  })

  it('Y5 50% exemption', () => {
    const incomes: Income[] = [{ category: 'A', gross: 30000, ss_paid: 3300 }]
    // Y5: 50% × 30000 = 15000, cap = 28737.50
    // Exemption = 15000
    const exemption = computeIrsJovemExemption(incomes, 5, year)
    expect(exemption).toBe(15000)
  })

  it('Y11+ returns 0', () => {
    expect(getIrsJovemExemptionRate(11, year)).toBe(0)
    expect(isEligibleForIrsJovem(11, year)).toBe(false)
  })
})

// ─── Cross-cutting ──────────────────────────────────────────

describe('IRS Jovem — edge cases', () => {
  it('non-qualifying income (Cat E/F/G/H) not included', () => {
    const incomes: Income[] = [
      { category: 'E', gross: 50000 },
      { category: 'F', gross: 30000 },
    ]
    const exemption = computeIrsJovemExemption(incomes, 1, 2025)
    expect(exemption).toBe(0)
  })

  it('mixed income: only A+B counts', () => {
    const incomes: Income[] = [
      { category: 'A', gross: 10000, ss_paid: 1100 },
      { category: 'E', gross: 50000 },
    ]
    // Y1 2025: 100% × 10000 (only Cat A) = 10000
    const exemption = computeIrsJovemExemption(incomes, 1, 2025)
    expect(exemption).toBe(10000)
  })

  it('unsupported tax year returns 0', () => {
    expect(getIrsJovemExemptionRate(1, 2020)).toBe(0)
    expect(getIrsJovemRegime(2020)).toBeUndefined()
  })

  it('isEligibleForIrsJovem respects per-year max', () => {
    expect(isEligibleForIrsJovem(3, 2021)).toBe(true) // 3yr regime
    expect(isEligibleForIrsJovem(4, 2021)).toBe(false) // exceeds 3yr
    expect(isEligibleForIrsJovem(5, 2023)).toBe(true) // 5yr regime
    expect(isEligibleForIrsJovem(6, 2023)).toBe(false) // exceeds 5yr
    expect(isEligibleForIrsJovem(10, 2025)).toBe(true) // 10yr regime
    expect(isEligibleForIrsJovem(11, 2025)).toBe(false) // exceeds 10yr
  })
})

// ─── Edge cases for branch coverage ─────────────────────────

describe('IRS Jovem — edge cases', () => {
  it('getIrsJovemCap returns 0 for benefitYear=0', () => {
    expect(getIrsJovemCap(0, 2025)).toBe(0)
  })

  it('getIrsJovemCap returns 0 for benefitYear exceeding regime max', () => {
    // 2021 only has 3 years
    expect(getIrsJovemCap(4, 2021)).toBe(0)
    // 2024 only has 5 years
    expect(getIrsJovemCap(6, 2024)).toBe(0)
    // 2025 has 10 years
    expect(getIrsJovemCap(11, 2025)).toBe(0)
  })

  it('getIrsJovemCap returns 0 for year before earliest regime', () => {
    // 2020 is before any IRS Jovem regime
    expect(getIrsJovemCap(1, 2020)).toBe(0)
  })

  it('getIrsJovemCap falls back to latest regime for future years', () => {
    // 2030 should fall back to 2025 regime
    expect(getIrsJovemCap(1, 2030)).toBe(getIrsJovemCap(1, 2025))
  })

  it('computeIrsJovemExemption returns 0 for year before earliest regime', () => {
    const incomes = [{ category: 'A' as const, gross: 30000 }]
    expect(computeIrsJovemExemption(incomes, 1, 2020)).toBe(0)
  })

  it('computeIrsJovemExemption falls back to latest regime for future years', () => {
    const incomes = [{ category: 'A' as const, gross: 30000 }]
    const result2025 = computeIrsJovemExemption(incomes, 1, 2025)
    const result2030 = computeIrsJovemExemption(incomes, 1, 2030)
    expect(result2030).toBe(result2025)
  })

  it('computeIrsJovemExemption returns 0 for benefitYear exceeding max', () => {
    const incomes = [{ category: 'A' as const, gross: 30000 }]
    expect(computeIrsJovemExemption(incomes, 4, 2021)).toBe(0) // 2021 max is 3
    expect(computeIrsJovemExemption(incomes, 6, 2024)).toBe(0) // 2024 max is 5
  })

  it('computeIrsJovemExemption returns 0 for benefitYear < 1', () => {
    const incomes = [{ category: 'A' as const, gross: 30000 }]
    expect(computeIrsJovemExemption(incomes, 0, 2025)).toBe(0)
    expect(computeIrsJovemExemption(incomes, -1, 2025)).toBe(0)
  })

  it('computeIrsJovemExemption caps at IAS-based limit', () => {
    // Very high income should hit the cap
    const incomes = [{ category: 'A' as const, gross: 200000 }]
    // 2025 Y1: rate=100%, cap=55×IAS=55×522.50=28737.50
    const exemption = computeIrsJovemExemption(incomes, 1, 2025)
    expect(exemption).toBe(28737.5)
  })

  it('computeIrsJovemExemption excludes Cat B when not eligible (pre-2022)', () => {
    const incomes = [
      { category: 'A' as const, gross: 10000 },
      { category: 'B' as const, gross: 20000 },
    ]
    // 2021 regime: catBEligible = false
    const exemption2021 = computeIrsJovemExemption(incomes, 1, 2021)
    // Only Cat A counts: 10000 × 0.30 = 3000 (capped by IAS factor)
    // 10000 × 0.30 = 3000, cap = 7.5 × IAS2021(438.81) = 3291.08 → 3000
    expect(exemption2021).toBe(3000)

    // 2025 regime: catBEligible = true
    const exemption2025 = computeIrsJovemExemption(incomes, 1, 2025)
    // Both count: 30000 × 1.00 = 30000, capped at 28737.50
    expect(exemption2025).toBe(28737.5)
  })

  it('isEligibleForIrsJovem with undefined benefitYear returns false', () => {
    expect(isEligibleForIrsJovem(undefined)).toBe(false)
    expect(isEligibleForIrsJovem(undefined, 2025)).toBe(false)
  })

  it('isEligibleForIrsJovem without taxYear uses fallback (max 10)', () => {
    expect(isEligibleForIrsJovem(1)).toBe(true)
    expect(isEligibleForIrsJovem(10)).toBe(true)
    expect(isEligibleForIrsJovem(11)).toBe(false)
  })

  it('isEligibleForIrsJovem with year before earliest regime returns false', () => {
    expect(isEligibleForIrsJovem(1, 2020)).toBe(false)
  })

  it('isEligibleForIrsJovem with future year falls back to latest regime', () => {
    expect(isEligibleForIrsJovem(1, 2030)).toBe(true)
    expect(isEligibleForIrsJovem(10, 2030)).toBe(true)
    expect(isEligibleForIrsJovem(11, 2030)).toBe(false)
  })

  it('getIrsJovemExemptionRate returns 0 for unsupported year', () => {
    expect(getIrsJovemExemptionRate(1, 2020)).toBe(0)
  })

  it('getIrsJovemExemptionRate returns 0 for out-of-range benefit year', () => {
    expect(getIrsJovemExemptionRate(0, 2025)).toBe(0)
    expect(getIrsJovemExemptionRate(11, 2025)).toBe(0)
  })
})

describe('deriveIrsJovemBenefitYear', () => {
  it('uses firstWorkYear for post-2025', () => {
    expect(deriveIrsJovemBenefitYear(undefined, 2020, 2025)).toBe(6)
    expect(deriveIrsJovemBenefitYear(undefined, 2025, 2025)).toBe(1)
    expect(deriveIrsJovemBenefitYear(undefined, 2016, 2025)).toBe(10)
  })

  it('uses degreeYear for pre-2025', () => {
    // benefitYear = taxYear - degreeYear → 2024 - 2020 = 4
    expect(deriveIrsJovemBenefitYear(undefined, undefined, 2024, 2020)).toBe(4)
    expect(deriveIrsJovemBenefitYear(undefined, undefined, 2023, 2020)).toBe(3)
  })

  it('prefers degreeYear over firstWorkYear for pre-2025', () => {
    // degree 2018, first work 2022. For 2024: should use degree → 2024 - 2018 = 6
    expect(deriveIrsJovemBenefitYear(undefined, 2022, 2024, 2018)).toBe(6)
  })

  it('prefers firstWorkYear over degreeYear for post-2025', () => {
    // degree 2018, first work 2022. For 2025: should use first_work → 2025 - 2022 + 1 = 4
    expect(deriveIrsJovemBenefitYear(undefined, 2022, 2025, 2018)).toBe(4)
  })

  it('uses explicit irsJovemYear when no stable anchor matches', () => {
    expect(deriveIrsJovemBenefitYear(3, undefined, 2025)).toBe(3)
  })

  it('returns undefined when nothing is set', () => {
    expect(deriveIrsJovemBenefitYear(undefined, undefined, 2025)).toBeUndefined()
  })

  it('returns undefined when firstWorkYear is after taxYear', () => {
    expect(deriveIrsJovemBenefitYear(undefined, 2026, 2025)).toBeUndefined()
  })

  it('falls back to firstWorkYear for pre-2025 when no degreeYear', () => {
    // No degree info but has firstWorkYear — use firstWorkYear as fallback
    expect(deriveIrsJovemBenefitYear(undefined, 2022, 2024)).toBe(3)
  })
})
