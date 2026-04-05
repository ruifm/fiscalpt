import { describe, it, expect } from 'vitest'
import {
  computeDeduction,
  computePersonDeductions,
  computeDependentDeduction,
  computeTotalDependentDeductions,
  computeTotalAscendantDeductions,
  isAscendantEligible,
  computePersonDisabilityDeduction,
  computeDependentDisabilityDeductions,
  computeAscendantDisabilityDeductions,
} from '@/lib/tax/deductions'
import type { Ascendant, Deduction, Dependent, Person } from '@/lib/tax/types'
import {
  IAS,
  PENSAO_MINIMA_ANUAL,
  ASCENDANT_DEDUCTION_BASE,
  ASCENDANT_DEDUCTION_SINGLE_BONUS,
  DISABILITY_TAXPAYER_IAS_MULTIPLIER,
  DISABILITY_DEPENDENT_IAS_MULTIPLIER,
} from '@/lib/tax/types'

describe('Individual Deductions', () => {
  it('should compute general deduction (35%, cap €250)', () => {
    expect(computeDeduction({ category: 'general', amount: 500 }, 2024)).toBe(175)
    expect(computeDeduction({ category: 'general', amount: 1000 }, 2024)).toBe(250) // capped
  })

  it('should compute health deduction (15%, cap €1,000)', () => {
    expect(computeDeduction({ category: 'health', amount: 2000 }, 2024)).toBe(300)
    expect(computeDeduction({ category: 'health', amount: 10000 }, 2024)).toBe(1000) // capped
  })

  it('should compute education deduction (30%, cap €800)', () => {
    expect(computeDeduction({ category: 'education', amount: 2000 }, 2024)).toBe(600)
    expect(computeDeduction({ category: 'education', amount: 5000 }, 2024)).toBe(800) // capped
  })

  it('should compute housing deduction (15%, cap €502) for 2024', () => {
    expect(computeDeduction({ category: 'housing', amount: 3000 }, 2024)).toBe(450)
    expect(computeDeduction({ category: 'housing', amount: 5000 }, 2024)).toBe(502) // capped at 502
  })

  it('should compute housing deduction (15%, cap €800) for 2025', () => {
    expect(computeDeduction({ category: 'housing', amount: 3000 }, 2025)).toBe(450)
    expect(computeDeduction({ category: 'housing', amount: 5000 }, 2025)).toBe(750)
    expect(computeDeduction({ category: 'housing', amount: 7000 }, 2025)).toBe(800) // capped at 800
  })

  it('should compute alimony deduction (100%, no cap)', () => {
    expect(computeDeduction({ category: 'alimony', amount: 5000 }, 2025)).toBe(5000)
    expect(computeDeduction({ category: 'alimony', amount: 12000 }, 2025)).toBe(12000)
  })

  it('should compute care home deduction (25%, cap €403.75)', () => {
    expect(computeDeduction({ category: 'care_home', amount: 1000 }, 2025)).toBe(250)
    expect(computeDeduction({ category: 'care_home', amount: 5000 }, 2025)).toBe(403.75)
  })
})

describe('PPR Age-Based Caps (Art. 21 nº 3 EBF)', () => {
  it('under 35: cap €400', () => {
    expect(computeDeduction({ category: 'ppr', amount: 3000 }, 2025, 1995)).toBe(400)
  })

  it('35-50: cap €350', () => {
    expect(computeDeduction({ category: 'ppr', amount: 3000 }, 2025, 1985)).toBe(350)
  })

  it('over 50: cap €300', () => {
    expect(computeDeduction({ category: 'ppr', amount: 3000 }, 2025, 1970)).toBe(300)
  })

  it('no birth year defaults to €400 cap', () => {
    expect(computeDeduction({ category: 'ppr', amount: 3000 }, 2025)).toBe(400)
  })

  it('PPR rate is 20%', () => {
    expect(computeDeduction({ category: 'ppr', amount: 1000 }, 2025, 1995)).toBe(200)
  })
})

describe('Person Deductions (aggregated)', () => {
  it('should aggregate deductions by category and apply caps', () => {
    const deductions: Deduction[] = [
      { category: 'general', amount: 400 },
      { category: 'general', amount: 400 }, // total 800, 35% = 280, capped at 250
      { category: 'health', amount: 1000 }, // 15% = 150
    ]
    expect(computePersonDeductions(deductions, 2024)).toBe(400) // 250 + 150
  })

  it('housing cap changes by year', () => {
    const deductions: Deduction[] = [
      { category: 'housing', amount: 6000 }, // 15% = 900
    ]
    expect(computePersonDeductions(deductions, 2024)).toBe(502) // capped at 502
    expect(computePersonDeductions(deductions, 2025)).toBe(800) // capped at 800
  })

  it('PPR cap respects age when birth_year provided', () => {
    const deductions: Deduction[] = [{ category: 'ppr', amount: 5000 }]
    expect(computePersonDeductions(deductions, 2025, 1995)).toBe(400) // <35, cap 400
    expect(computePersonDeductions(deductions, 2025, 1985)).toBe(350) // 35-50, cap 350
    expect(computePersonDeductions(deductions, 2025, 1970)).toBe(300) // >50, cap 300
  })
})

describe('Dependent Deductions', () => {
  it('should give €900 for child under 3', () => {
    expect(computeDependentDeduction({ name: 'Baby', birth_year: 2023 }, 2025)).toBe(900)
  })

  it('should give €726 for child aged 3-6', () => {
    expect(computeDependentDeduction({ name: 'Toddler', birth_year: 2020 }, 2025)).toBe(726)
    expect(computeDependentDeduction({ name: 'Kid', birth_year: 2019 }, 2025)).toBe(726)
  })

  it('should give €600 for child over 6', () => {
    expect(computeDependentDeduction({ name: 'Child', birth_year: 2015 }, 2025)).toBe(600)
  })

  it('should compute total for multiple dependents', () => {
    const deps: Dependent[] = [
      { name: 'A', birth_year: 2023 }, // 900
      { name: 'B', birth_year: 2020 }, // 726
      { name: 'C', birth_year: 2010 }, // 600
    ]
    expect(computeTotalDependentDeductions(deps, 2025)).toBe(2226)
  })

  it('shared custody halves deduction', () => {
    expect(
      computeDependentDeduction({ name: 'A', birth_year: 2010, shared_custody: true }, 2025),
    ).toBe(300) // 600 / 2
    expect(
      computeDependentDeduction({ name: 'B', birth_year: 2023, shared_custody: true }, 2025),
    ).toBe(450) // 900 / 2
  })
})

// ─── New Deduction Categories ───────────────────────────────

describe('Fatura Deduction (Art. 78-F)', () => {
  it('15% of VAT amount', () => {
    expect(computeDeduction({ category: 'fatura', amount: 1000 }, 2025)).toBe(150)
  })

  it('capped at €250', () => {
    expect(computeDeduction({ category: 'fatura', amount: 2000 }, 2025)).toBe(250)
  })

  it('cap is €250 for all years 2021-2025', () => {
    for (const year of [2021, 2022, 2023, 2024, 2025]) {
      expect(computeDeduction({ category: 'fatura', amount: 5000 }, year)).toBe(250)
    }
  })
})

describe('Trabalho Doméstico Deduction', () => {
  it('fully deductible', () => {
    expect(computeDeduction({ category: 'trabalho_domestico', amount: 500 }, 2025)).toBe(500)
  })
})

describe('Disability Rehab Deduction (Art. 87 nº 3)', () => {
  it('30% of expenses, no cap', () => {
    expect(computeDeduction({ category: 'disability_rehab', amount: 10000 }, 2025)).toBe(3000)
    expect(computeDeduction({ category: 'disability_rehab', amount: 100000 }, 2025)).toBe(30000)
  })
})

describe('Disability Insurance Deduction (Art. 87 nº 4)', () => {
  it('25% of premiums (cap applied separately at coleta level)', () => {
    expect(computeDeduction({ category: 'disability_insurance', amount: 1000 }, 2025)).toBe(250)
    expect(computeDeduction({ category: 'disability_insurance', amount: 10000 }, 2025)).toBe(2500)
  })
})

describe('Sindical (Union Dues) Deduction', () => {
  it('fully deductible', () => {
    expect(computeDeduction({ category: 'sindical', amount: 300 }, 2025)).toBe(300)
  })
})

// ─── Ascendant Deductions (Art. 78-A) ─────────────────────────

describe('Ascendant Deductions (Art. 78-A)', () => {
  it('1 ascendant = €635 (€525 + €110 bonus)', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: 3000 }]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(
      ASCENDANT_DEDUCTION_BASE + ASCENDANT_DEDUCTION_SINGLE_BONUS,
    )
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(635)
  })

  it('2 ascendants = €1,050 (€525 × 2, no bonus)', () => {
    const asc: Ascendant[] = [
      { name: 'Mãe', income: 3000 },
      { name: 'Pai', income: 3000 },
    ]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(1050)
  })

  it('3 ascendants = €1,575 (€525 × 3)', () => {
    const asc: Ascendant[] = [{ name: 'Mãe' }, { name: 'Pai' }, { name: 'Avó' }]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(1575)
  })

  it('0 ascendants = €0', () => {
    expect(computeTotalAscendantDeductions([], 2025)).toBe(0)
  })

  it('ineligible ascendant (income > pension minimum) excluded', () => {
    const asc: Ascendant[] = [
      { name: 'Mãe', income: PENSAO_MINIMA_ANUAL[2025] + 1 }, // over limit
    ]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(0)
  })

  it('income exactly at pension minimum is eligible', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: PENSAO_MINIMA_ANUAL[2025] }]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(635)
  })

  it('no income specified = eligible (income unknown assumed ok)', () => {
    const asc: Ascendant[] = [{ name: 'Mãe' }]
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(635)
  })

  it('mixed eligible/ineligible: only eligible count', () => {
    const asc: Ascendant[] = [
      { name: 'Mãe', income: 3000 }, // eligible
      { name: 'Pai', income: 50000 }, // ineligible
    ]
    // Only 1 eligible → gets single bonus
    expect(computeTotalAscendantDeductions(asc, 2025)).toBe(635)
  })

  it('pension minimum varies by year', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: 3500 }]
    // 2021: pensão mín = €3,303.60 → €3,500 > limit → ineligible
    expect(isAscendantEligible(asc[0], 2021)).toBe(false)
    expect(computeTotalAscendantDeductions(asc, 2021)).toBe(0)
    // 2024: pensão mín = €3,833.88 → €3,500 < limit → eligible
    expect(isAscendantEligible(asc[0], 2024)).toBe(true)
    expect(computeTotalAscendantDeductions(asc, 2024)).toBe(635)
  })
})

// ─── Disability Deductions (Art. 87) ──────────────────────────

describe('Person Disability Deduction (Art. 87 nº 1)', () => {
  const makePerson = (disability_degree?: number): Person => ({
    name: 'Test',
    incomes: [{ category: 'A', gross: 30000 }],
    deductions: [],
    special_regimes: [],
    disability_degree,
  })

  it('no disability = €0', () => {
    expect(computePersonDisabilityDeduction(makePerson(), 2025)).toBe(0)
    expect(computePersonDisabilityDeduction(makePerson(0), 2025)).toBe(0)
    expect(computePersonDisabilityDeduction(makePerson(59), 2025)).toBe(0)
  })

  it('60% disability = 4 × IAS', () => {
    const ias2025 = IAS[2025]
    const expected = Math.round(DISABILITY_TAXPAYER_IAS_MULTIPLIER * ias2025 * 100) / 100
    expect(computePersonDisabilityDeduction(makePerson(60), 2025)).toBe(expected)
    expect(expected).toBe(2090) // 4 × 522.50
  })

  it('80% disability = 4 × IAS (same, no companion)', () => {
    expect(computePersonDisabilityDeduction(makePerson(80), 2025)).toBe(2090)
  })

  it('90% disability = 4 × IAS taxpayer + 4 × IAS companion = 8 × IAS', () => {
    const result = computePersonDisabilityDeduction(makePerson(90), 2025)
    expect(result).toBe(4180) // 8 × 522.50
  })

  it('100% disability = same as 90%', () => {
    expect(computePersonDisabilityDeduction(makePerson(100), 2025)).toBe(4180)
  })

  it('IAS varies by year', () => {
    const ias2021 = IAS[2021] // 438.81
    expect(computePersonDisabilityDeduction(makePerson(60), 2021)).toBe(
      Math.round(4 * ias2021 * 100) / 100,
    )
    expect(computePersonDisabilityDeduction(makePerson(60), 2021)).toBe(1755.24)
  })
})

describe('Dependent Disability Deductions (Art. 87 nº 2)', () => {
  it('disabled dependent (≥60%) = 2.5 × IAS', () => {
    const deps: Dependent[] = [{ name: 'Child', birth_year: 2015, disability_degree: 60 }]
    const ias2025 = IAS[2025]
    const expected = Math.round(DISABILITY_DEPENDENT_IAS_MULTIPLIER * ias2025 * 100) / 100
    expect(computeDependentDisabilityDeductions(deps, 2025)).toBe(expected)
    expect(expected).toBe(1306.25) // 2.5 × 522.50
  })

  it('non-disabled dependent = €0', () => {
    const deps: Dependent[] = [{ name: 'Child', birth_year: 2015 }]
    expect(computeDependentDisabilityDeductions(deps, 2025)).toBe(0)
  })

  it('disability < 60% = €0', () => {
    const deps: Dependent[] = [{ name: 'Child', birth_year: 2015, disability_degree: 59 }]
    expect(computeDependentDisabilityDeductions(deps, 2025)).toBe(0)
  })

  it('multiple disabled dependents', () => {
    const deps: Dependent[] = [
      { name: 'A', birth_year: 2015, disability_degree: 70 },
      { name: 'B', birth_year: 2018, disability_degree: 80 },
    ]
    expect(computeDependentDisabilityDeductions(deps, 2025)).toBe(2612.5) // 2 × 1306.25
  })

  it('shared custody halves disability deduction too', () => {
    const deps: Dependent[] = [
      { name: 'Child', birth_year: 2015, disability_degree: 60, shared_custody: true },
    ]
    expect(computeDependentDisabilityDeductions(deps, 2025)).toBe(653.13) // 1306.25 / 2, rounded
  })
})

describe('Ascendant Disability Deductions (Art. 87 nº 2)', () => {
  it('disabled eligible ascendant = 2.5 × IAS', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: 3000, disability_degree: 70 }]
    expect(computeAscendantDisabilityDeductions(asc, 2025)).toBe(1306.25)
  })

  it('disabled but ineligible ascendant (high income) = €0', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: 50000, disability_degree: 70 }]
    expect(computeAscendantDisabilityDeductions(asc, 2025)).toBe(0)
  })

  it('eligible but not disabled = €0', () => {
    const asc: Ascendant[] = [{ name: 'Mãe', income: 3000 }]
    expect(computeAscendantDisabilityDeductions(asc, 2025)).toBe(0)
  })
})

// ─── Edge cases for branch coverage ─────────────────────────

describe('Deduction edge cases', () => {
  it('computeDeduction returns 0 for unknown category', () => {
    // @ts-expect-error testing unknown category
    expect(computeDeduction({ category: 'nonexistent', amount: 1000 }, 2025)).toBe(0)
  })

  it('computePersonDeductions skips unknown categories', () => {
    const deductions = [
      { category: 'health' as const, amount: 500 },
      { category: 'unknown_thing' as unknown as 'health', amount: 1000 },
      { category: 'education' as const, amount: 300 },
    ]
    const total = computePersonDeductions(deductions, 2025)
    // Only health (500×0.15=75) + education (300×0.30=90) counted
    expect(total).toBeCloseTo(75 + 90, 2)
  })

  it('computeDeduction with zero amount returns 0', () => {
    expect(computeDeduction({ category: 'health', amount: 0 }, 2025)).toBe(0)
  })

  it('PPR deduction uses age-based cap', () => {
    // Under 35: cap €400
    const young = computeDeduction({ category: 'ppr', amount: 5000 }, 2025, 1995)
    // 5000 × 0.20 = 1000, capped at €400
    expect(young).toBe(400)

    // 35-50: cap €350
    const mid = computeDeduction({ category: 'ppr', amount: 5000 }, 2025, 1980)
    expect(mid).toBe(350)

    // Over 50: cap €300
    const older = computeDeduction({ category: 'ppr', amount: 5000 }, 2025, 1960)
    expect(older).toBe(300)
  })

  it('general deduction capped at €250', () => {
    const d = computeDeduction({ category: 'general', amount: 2000 }, 2025)
    // 2000 × 0.35 = 700, capped at €250
    expect(d).toBe(250)
  })

  it('health deduction capped at €1000', () => {
    const d = computeDeduction({ category: 'health', amount: 10000 }, 2025)
    // 10000 × 0.15 = 1500, capped at €1000
    expect(d).toBe(1000)
  })

  it('education deduction capped at €800', () => {
    const d = computeDeduction({ category: 'education', amount: 5000 }, 2025)
    // 5000 × 0.30 = 1500, capped at €800
    expect(d).toBe(800)
  })

  it('housing deduction capped at €502 (pre-2025)', () => {
    const d = computeDeduction({ category: 'housing', amount: 5000 }, 2024)
    // 5000 × 0.15 = 750, capped at €502
    expect(d).toBe(502)
  })

  it('housing deduction capped at €800 (2025 OE)', () => {
    const d = computeDeduction({ category: 'housing', amount: 10000 }, 2025)
    // 10000 × 0.15 = 1500, capped at €800
    expect(d).toBe(800)
  })
})
