import { describe, it, expect } from 'vitest'
import {
  computeProgressiveTax,
  getBrackets,
  getMarginalRate,
  BRACKETS_2021,
  BRACKETS_2022,
  BRACKETS_2023,
  BRACKETS_2024,
  BRACKETS_2025,
} from '@/lib/tax/brackets'

// ─── Hand-computed reference values ──────────────────────────
// All expected values computed from official Art. 68 CIRS bracket tables.

describe('Bracket tables — structure', () => {
  it('2021 has 7 brackets (Lei 2/2020)', () => {
    expect(BRACKETS_2021).toHaveLength(7)
    expect(BRACKETS_2021[0]).toEqual({ upper_limit: 7112, rate: 0.145 })
    expect(BRACKETS_2021[6]).toEqual({ upper_limit: Infinity, rate: 0.48 })
  })

  it('2022 has 9 brackets (Lei 12/2022)', () => {
    expect(BRACKETS_2022).toHaveLength(9)
    expect(BRACKETS_2022[0]).toEqual({ upper_limit: 7116, rate: 0.145 })
    expect(BRACKETS_2022[8]).toEqual({ upper_limit: Infinity, rate: 0.48 })
  })

  it('2023 has 9 brackets (Lei 24-D/2022)', () => {
    expect(BRACKETS_2023).toHaveLength(9)
    expect(BRACKETS_2023[0]).toEqual({ upper_limit: 7479, rate: 0.145 })
    expect(BRACKETS_2023[8]).toEqual({ upper_limit: Infinity, rate: 0.48 })
  })

  it('2024 has 9 brackets (Lei 33/2024) with corrected upper limits', () => {
    expect(BRACKETS_2024).toHaveLength(9)
    // These were incorrectly 51997 and 81199 (from Lei 82/2023 initial OE)
    expect(BRACKETS_2024[6]).toEqual({ upper_limit: 43000, rate: 0.435 })
    expect(BRACKETS_2024[7]).toEqual({ upper_limit: 80000, rate: 0.45 })
    expect(BRACKETS_2024[8]).toEqual({ upper_limit: Infinity, rate: 0.48 })
  })

  it('2025 has 9 brackets (OE 2025)', () => {
    expect(BRACKETS_2025).toHaveLength(9)
    expect(BRACKETS_2025[0]).toEqual({ upper_limit: 8059, rate: 0.125 })
  })
})

describe('getBrackets', () => {
  it('returns brackets for all supported years 2021-2025', () => {
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      expect(() => getBrackets(year)).not.toThrow()
    }
  })

  it('throws for years before earliest supported', () => {
    expect(() => getBrackets(2020)).toThrow()
  })

  it('falls back to latest available year for future years', () => {
    expect(getBrackets(2026)).toEqual(BRACKETS_2025)
    expect(getBrackets(2030)).toEqual(BRACKETS_2025)
  })
})

describe('computeProgressiveTax — 2024 (Lei 33/2024)', () => {
  const brackets = BRACKETS_2024

  it('returns 0 for zero or negative income', () => {
    expect(computeProgressiveTax(0, brackets)).toBe(0)
    expect(computeProgressiveTax(-100, brackets)).toBe(0)
  })

  it('first bracket only: €5,000 at 13%', () => {
    expect(computeProgressiveTax(5000, brackets)).toBe(650)
  })

  it('boundary: exactly at first bracket limit €7,703', () => {
    // 7703 × 0.13 = 1001.39
    expect(computeProgressiveTax(7703, brackets)).toBe(1001.39)
  })

  it('boundary ±1: tax jumps correctly at bracket edges', () => {
    // €7,702 — still entirely in bracket 1 (13%)
    // 7702 × 0.13 = 1001.26
    expect(computeProgressiveTax(7702, brackets)).toBe(1001.26)

    // €7,704 — €1 spills into bracket 2 (16.5%)
    // 7703 × 0.13 + 1 × 0.165 = 1001.39 + 0.165 = 1001.56 (rounded)
    expect(computeProgressiveTax(7704, brackets)).toBe(1001.56)

    // €11,622 — €1 below bracket 2 limit
    // 7703 × 0.13 + 3919 × 0.165 = 1001.39 + 646.635 = 1648.03
    expect(computeProgressiveTax(11622, brackets)).toBe(1648.03)

    // €11,624 — €1 above bracket 2 limit → bracket 3 (22%)
    // 7703 × 0.13 + 3920 × 0.165 + 1 × 0.22 = 1648.19 + 0.22 = 1648.41
    expect(computeProgressiveTax(11624, brackets)).toBe(1648.41)
  })

  it('€10,000 spans first two brackets', () => {
    // 7703 × 0.13 + (10000-7703) × 0.165
    // = 1001.39 + 2297 × 0.165 = 1001.39 + 379.005 = 1380.395 → 1380.40
    expect(computeProgressiveTax(10000, brackets)).toBeCloseTo(1380.4, 1)
  })

  it('€25,000 spans 5 brackets', () => {
    // 7703 × 0.13 = 1001.39
    // (11623-7703) × 0.165 = 3920 × 0.165 = 646.80
    // (16472-11623) × 0.22 = 4849 × 0.22 = 1066.78
    // (21321-16472) × 0.25 = 4849 × 0.25 = 1212.25
    // (25000-21321) × 0.32 = 3679 × 0.32 = 1177.28
    // Total = 5104.50
    expect(computeProgressiveTax(25000, brackets)).toBeCloseTo(5104.5, 0)
  })

  it('€43,000 boundary (7th bracket, corrected from 51997)', () => {
    // 7703 × 0.13 = 1001.39
    // 3920 × 0.165 = 646.80
    // 4849 × 0.22 = 1066.78
    // 4849 × 0.25 = 1212.25
    // 5825 × 0.32 = 1864.00
    // 12645 × 0.355 = 4488.975
    // (43000-39791) × 0.435 = 3209 × 0.435 = 1395.915
    // Total = 11676.11
    expect(computeProgressiveTax(43000, brackets)).toBeCloseTo(11676.11, 0)
  })

  it('€50,000 now spans into 8th bracket (45%)', () => {
    // Through 43000 = 11676.11
    // (50000-43000) × 0.45 = 7000 × 0.45 = 3150
    // Total = 14826.11
    expect(computeProgressiveTax(50000, brackets)).toBeCloseTo(14826.11, 0)
  })

  it('€100,000 reaches top bracket', () => {
    // Through 80000:
    // 11676.11 + (80000-43000) × 0.45 = 11676.11 + 16650 = 28326.11
    // (100000-80000) × 0.48 = 9600
    // Total = 37926.11
    expect(computeProgressiveTax(100000, brackets)).toBeCloseTo(37926.11, 0)
  })
})

describe('computeProgressiveTax — 2021 (Lei 2/2020, 7 brackets)', () => {
  const brackets = BRACKETS_2021

  it('€5,000 at 14.5%', () => {
    expect(computeProgressiveTax(5000, brackets)).toBe(725)
  })

  it('€7,112 boundary', () => {
    // 7112 × 0.145 = 1031.24
    expect(computeProgressiveTax(7112, brackets)).toBe(1031.24)
  })

  it('€15,000 spans 3 brackets', () => {
    // 7112 × 0.145 = 1031.24
    // (10732-7112) × 0.23 = 3620 × 0.23 = 832.60
    // (15000-10732) × 0.285 = 4268 × 0.285 = 1216.38
    // Total = 3080.22
    expect(computeProgressiveTax(15000, brackets)).toBeCloseTo(3080.22, 1)
  })

  it('€100,000 reaches top bracket (48%)', () => {
    // Through 80882:
    // 7112 × 0.145 = 1031.24
    // 3620 × 0.23 = 832.60
    // 9590 × 0.285 = 2733.15
    // 4753 × 0.35 = 1663.55
    // 11892 × 0.37 = 4400.04
    // 43915 × 0.45 = 19761.75
    // (100000-80882) × 0.48 = 19118 × 0.48 = 9176.64
    // Total = 39598.97
    expect(computeProgressiveTax(100000, brackets)).toBeCloseTo(39598.97, 0)
  })
})

describe('computeProgressiveTax — 2022 (Lei 12/2022)', () => {
  const brackets = BRACKETS_2022

  it('€10,000 spans 2 brackets', () => {
    // 7116 × 0.145 = 1031.82
    // (10000-7116) × 0.23 = 2884 × 0.23 = 663.32
    // Total = 1695.14
    expect(computeProgressiveTax(10000, brackets)).toBeCloseTo(1695.14, 1)
  })
})

describe('computeProgressiveTax — 2023 (Lei 24-D/2022)', () => {
  const brackets = BRACKETS_2023

  it('€7,479 boundary', () => {
    // 7479 × 0.145 = 1084.455 → 1084.46
    expect(computeProgressiveTax(7479, brackets)).toBeCloseTo(1084.46, 1)
  })

  it('€20,000 spans 4 brackets', () => {
    // 7479 × 0.145 = 1084.455
    // (11284-7479) × 0.21 = 3805 × 0.21 = 799.05
    // (15992-11284) × 0.265 = 4708 × 0.265 = 1247.62
    // (20000-15992) × 0.285 = 4008 × 0.285 = 1142.28
    // Total = 4273.405 → 4273.41
    expect(computeProgressiveTax(20000, brackets)).toBeCloseTo(4273.41, 0)
  })
})

describe('computeProgressiveTax — 2025 vs 2024', () => {
  it('2025 produces lower tax for same income', () => {
    for (const income of [10000, 25000, 50000, 80000]) {
      const tax2024 = computeProgressiveTax(income, BRACKETS_2024)
      const tax2025 = computeProgressiveTax(income, BRACKETS_2025)
      expect(tax2025).toBeLessThan(tax2024)
    }
  })
})

describe('getMarginalRate', () => {
  it('returns 0 for zero income', () => {
    expect(getMarginalRate(0, BRACKETS_2024)).toBe(0)
  })

  it('returns first bracket rate for small income', () => {
    expect(getMarginalRate(5000, BRACKETS_2024)).toBe(0.13)
    expect(getMarginalRate(5000, BRACKETS_2021)).toBe(0.145)
  })

  it('returns top rate for high income', () => {
    expect(getMarginalRate(100000, BRACKETS_2024)).toBe(0.48)
    expect(getMarginalRate(100000, BRACKETS_2025)).toBe(0.48)
  })

  it('returns correct rate at corrected 2024 boundaries', () => {
    expect(getMarginalRate(43000, BRACKETS_2024)).toBe(0.435)
    expect(getMarginalRate(43001, BRACKETS_2024)).toBe(0.45)
    expect(getMarginalRate(80000, BRACKETS_2024)).toBe(0.45)
    expect(getMarginalRate(80001, BRACKETS_2024)).toBe(0.48)
  })
})
