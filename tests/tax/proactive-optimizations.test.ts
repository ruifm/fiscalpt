import { describe, it, expect } from 'vitest'
import { generateProactiveOptimizations } from '@/lib/tax/proactive-optimizations'
import type { Household, AnalysisResult, ScenarioResult, PersonTaxDetail } from '@/lib/tax/types'

function makePerson(overrides?: Partial<PersonTaxDetail>): PersonTaxDetail {
  return {
    name: 'Test',
    gross_income: 30000,
    taxable_income: 25896,
    irs_before_deductions: 4000,
    deductions_total: 500,
    irs_after_deductions: 3500,
    autonomous_tax: 0,
    solidarity_surcharge: 0,
    specific_deduction: 4104,
    cat_b_acrescimo: 0,
    double_taxation_credit: 0,
    ss_total: 3300,
    withholding_total: 5000,
    irs_jovem_exemption: 0,
    nhr_tax: 0,
    minimo_existencia_applied: false,
    effective_rate_irs: 0.1167,
    effective_rate_total: 0.2267,
    dependent_deduction_share: 0,
    ascendant_deduction_share: 0,
    disability_deductions: 0,
    ...overrides,
  }
}

function makeScenario(persons: PersonTaxDetail[]): ScenarioResult {
  const totalGross = persons.reduce((s, p) => s + p.gross_income, 0)
  const totalIrs = persons.reduce(
    (s, p) => s + p.irs_after_deductions + p.autonomous_tax + p.solidarity_surcharge + p.nhr_tax,
    0,
  )
  const totalSs = persons.reduce((s, p) => s + p.ss_total, 0)
  return {
    label: 'test',
    filing_status: 'single',
    persons,
    total_gross: totalGross,
    total_taxable: persons.reduce((s, p) => s + p.taxable_income, 0),
    total_irs: totalIrs,
    total_ss: totalSs,
    total_deductions: persons.reduce((s, p) => s + p.deductions_total, 0),
    total_tax_burden: totalIrs + totalSs,
    total_net: totalGross - totalIrs - totalSs,
    effective_rate_irs: totalGross > 0 ? totalIrs / totalGross : 0,
    effective_rate_total: totalGross > 0 ? (totalIrs + totalSs) / totalGross : 0,
  }
}

function makeResult(household: Household, scenario: ScenarioResult): AnalysisResult {
  return {
    year: household.year,
    household,
    scenarios: [scenario],
    recommended_scenario: scenario.label,
    optimizations: [],
  }
}

function makeHousehold(overrides?: Partial<Household>): Household {
  return {
    year: 2026,
    filing_status: 'single',
    projected: true,
    members: [
      {
        name: 'Alice',
        nif: '123456789',
        birth_year: 1990,
        incomes: [{ category: 'A', gross: 30000 }],
        deductions: [],
        special_regimes: [],
      },
    ],
    dependents: [],
    ...overrides,
  }
}

describe('generateProactiveOptimizations', () => {
  describe('general deduction maximization', () => {
    it('suggests maximizing general deduction when not at cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'general', amount: 400 }], // only €400 in e-fatura
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson({ deductions_total: 140 }) // 400 × 0.35 = 140
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const genOpt = opts.find((o) => o.id === 'general-deduction-alice')
      expect(genOpt).toBeDefined()
      expect(genOpt!.estimated_savings).toBe(110)
    })

    it('does not suggest when general deduction is already at cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'general', amount: 750 }], // 750 × 0.35 = 262.50 > 250 cap
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson({ deductions_total: 250 })
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const genOpt = opts.find((o) => o.id === 'general-deduction-alice')
      expect(genOpt).toBeUndefined()
    })
  })

  describe('Cat B acréscimo avoidance', () => {
    it('suggests avoiding acréscimo when documented expenses below 15%', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Bob',
            nif: '456',
            birth_year: 1985,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_documented_expenses: 3000, // 7.5% < 15%
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson({
        name: 'Bob',
        cat_b_acrescimo: 3000, // 40000×0.15 - 3000 = 3000
      })
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const catBOpt = opts.find((o) => o.id === 'cat-b-acrescimo-bob')
      expect(catBOpt).toBeDefined()
      expect(catBOpt!.estimated_savings).toBe(525.15)
    })

    it('uses 0.22 fallback marginal rate when effective_rate_irs is 0', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Bob',
            nif: '456',
            birth_year: 1985,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_documented_expenses: 3000, // 7.5% < 15%
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson({
        name: 'Bob',
        cat_b_acrescimo: 3000,
        effective_rate_irs: 0, // triggers 0.22 fallback branch
      })
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const catBOpt = opts.find((o) => o.id === 'cat-b-acrescimo-bob')
      expect(catBOpt).toBeDefined()
      // savings = round2(3000 × 0.22) = 660
      expect(catBOpt!.estimated_savings).toBe(660)
    })

    it('does not suggest when no Cat B income', () => {
      const h = makeHousehold()
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const catBOpt = opts.find((o) => o.id.startsWith('cat-b-acrescimo'))
      expect(catBOpt).toBeUndefined()
    })
  })

  describe('PPR subscription', () => {
    it('suggests PPR when none subscribed', () => {
      const h = makeHousehold()
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const pprOpt = opts.find((o) => o.id === 'ppr-alice')
      expect(pprOpt).toBeDefined()
      // age 36 in 2026 → cap €350, 20% rate → €70 savings estimate
      expect(pprOpt!.estimated_savings).toBe(70)
    })

    it('does not suggest PPR when already subscribed', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'ppr', amount: 2000 }],
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson({ deductions_total: 400 })
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const pprOpt = opts.find((o) => o.id === 'ppr-alice')
      expect(pprOpt).toBeUndefined()
    })
  })

  describe('e-fatura (Art. 78-F)', () => {
    it('suggests maximizing e-fatura when below cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'fatura', amount: 500 }], // 500 × 0.15 = 75 < 250 cap
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const faturaOpt = opts.find((o) => o.id === 'fatura-alice')
      expect(faturaOpt).toBeDefined()
      expect(faturaOpt!.estimated_savings).toBe(175)
    })

    it('does not suggest e-fatura when already at cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'fatura', amount: 2000 }], // 2000 × 0.15 = 300 > 250 cap
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const faturaOpt = opts.find((o) => o.id === 'fatura-alice')
      expect(faturaOpt).toBeUndefined()
    })
  })

  describe('expense gap targets', () => {
    it('suggests health expense target when below cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'health', amount: 2000 }], // 2000 × 0.15 = 300 < 1000 cap
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const healthOpt = opts.find((o) => o.id === 'expense-health-alice')
      expect(healthOpt).toBeDefined()
      expect(healthOpt!.estimated_savings).toBe(700)
    })

    it('does not suggest health target when at cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'health', amount: 7000 }], // 7000 × 0.15 = 1050 > 1000 cap
            special_regimes: [],
          },
        ],
      })
      const personDetail = makePerson()
      const result = makeResult(h, makeScenario([personDetail]))
      const opts = generateProactiveOptimizations(h, result)
      const healthOpt = opts.find((o) => o.id === 'expense-health-alice')
      expect(healthOpt).toBeUndefined()
    })
  })

  it('returns empty for non-projected years', () => {
    const h = makeHousehold({ projected: false })
    const personDetail = makePerson()
    const result = makeResult(h, makeScenario([personDetail]))
    const opts = generateProactiveOptimizations(h, result)
    expect(opts).toHaveLength(0)
  })

  it('generates optimizations for all members in a couple', () => {
    const h = makeHousehold({
      filing_status: 'married_joint',
      members: [
        {
          name: 'Alice',
          nif: '123',
          birth_year: 1990,
          incomes: [{ category: 'A', gross: 30000 }],
          deductions: [],
          special_regimes: [],
        },
        {
          name: 'Bob',
          nif: '456',
          birth_year: 1985,
          incomes: [{ category: 'A', gross: 25000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
    })
    const personA = makePerson({ name: 'Alice' })
    const personB = makePerson({ name: 'Bob', gross_income: 25000 })
    const result = makeResult(h, makeScenario([personA, personB]))
    const opts = generateProactiveOptimizations(h, result)
    // Both should get PPR suggestions
    expect(opts.find((o) => o.id === 'ppr-alice')).toBeDefined()
    expect(opts.find((o) => o.id === 'ppr-bob')).toBeDefined()
  })

  // Feature 5: PPR under-cap detection
  describe('PPR under-cap detection', () => {
    it('suggests maximizing PPR when contribution is below age-based cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1995, // age 31 → cap €400
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'ppr', amount: 1000 }], // invested €1000, deduction = €200
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      const pprOpt = opts.find((o) => o.id === 'ppr-maximize-alice')
      expect(pprOpt).toBeDefined()
      expect(pprOpt!.estimated_savings).toBe(200)
      expect(pprOpt!.description).toContain('1000') // additional €1000 needed
    })

    it('does not suggest PPR maximize when already at cap', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1995, // cap €400
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'ppr', amount: 2000 }], // 2000 × 0.2 = 400 = cap
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      expect(opts.find((o) => o.id === 'ppr-maximize-alice')).toBeUndefined()
      expect(opts.find((o) => o.id === 'ppr-alice')).toBeUndefined()
    })

    it('uses age-based cap for 35-50 bracket', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Bob',
            nif: '456',
            birth_year: 1980, // age 46 → cap €350
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'ppr', amount: 500 }], // 500 × 0.2 = 100 < 350
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson({ name: 'Bob' })]))
      const opts = generateProactiveOptimizations(h, result)
      const pprOpt = opts.find((o) => o.id === 'ppr-maximize-bob')
      expect(pprOpt).toBeDefined()
      // Gap: 350 - 100 = 250. Need additional: (350/0.2) - 500 = 1250
      expect(pprOpt!.estimated_savings).toBe(250)
    })
  })

  // Feature 1: Cat B Simplified vs Organized
  describe('Cat B regime comparison', () => {
    it('suggests organized regime when break-even point is reasonable', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_regime: 'simplified',
                cat_b_income_code: 403, // coefficient 0.75
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      const catBOpt = opts.find((o) => o.id === 'cat-b-regime-alice')
      expect(catBOpt).toBeDefined()
      // Simplified taxable = 40000 × 0.75 = 30000
      // Break-even expenses = gross - simplified = 40000 - 30000 = 10000
      // As % of gross: 10000/40000 = 25%
      expect(catBOpt!.description).toContain('10000') // break-even point
    })

    it('includes acréscimo in break-even when documented expenses below 15%', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Carol',
            birth_year: 1990,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_regime: 'simplified',
                cat_b_income_code: 403, // coefficient 0.75
                cat_b_documented_expenses: 2000, // 5% < 15% → acréscimo added
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson({ gross_income: 40000 })]))
      const opts = generateProactiveOptimizations(h, result)
      const catBRegime = opts.find((o) => o.id === 'cat-b-regime-carol')
      expect(catBRegime).toBeDefined()
      // simplifiedTaxable = 40000 × 0.75 = 30000
      // minExpenses = 40000 × 0.15 = 6000, documented = 2000 < 6000
      // acréscimo = 6000 - 2000 = 4000, simplifiedTaxable = 34000
      // breakEvenExpenses = 40000 - 34000 = 6000
      expect(catBRegime!.description).toContain('6000')
    })

    it('does not suggest for organized regime', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_regime: 'organized',
                expenses: 20000,
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      expect(opts.find((o) => o.id === 'cat-b-regime-alice')).toBeUndefined()
    })

    it('does not suggest for non-projected households', () => {
      const h = makeHousehold({
        projected: false,
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'B', gross: 40000, cat_b_regime: 'simplified' }],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      expect(opts.find((o) => o.id === 'cat-b-regime-alice')).toBeUndefined()
    })
  })

  // Feature 4: e-Fatura category correction
  describe('e-Fatura category correction', () => {
    it('suggests checking e-fatura categories for projected years', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'general', amount: 800 }],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      const faturaOpt = opts.find((o) => o.id === 'fatura-correction-alice')
      expect(faturaOpt).toBeDefined()
      expect(faturaOpt!.estimated_savings).toBe(0) // informational only
    })

    it('does not suggest e-fatura correction for non-projected years', () => {
      const h = makeHousehold({
        projected: false,
        members: [
          {
            name: 'Alice',
            nif: '123',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'general', amount: 800 }],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      expect(opts.find((o) => o.id === 'fatura-correction-alice')).toBeUndefined()
    })
  })

  describe('branch coverage — PPR age > 50', () => {
    it('uses €300 PPR cap for person over 50', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Senior',
            birth_year: 1970, // age 56 at tax year 2026
            incomes: [{ category: 'A', gross: 40000 }],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson({ gross_income: 40000 })]))
      const opts = generateProactiveOptimizations(h, result)
      const ppr = opts.find((o) => o.id === 'ppr-senior')
      expect(ppr).toBeDefined()
      // Cap €300 × 20% = €60
      expect(ppr!.estimated_savings).toBe(60)
    })
  })

  describe('branch coverage — housing with existing expenses', () => {
    it('accounts for existing housing deductions in gap calculation', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          {
            name: 'Alice',
            birth_year: 1990,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [{ category: 'housing', amount: 2000 }], // 2000 × 15% = 300 < 800 cap
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson()]))
      const opts = generateProactiveOptimizations(h, result)
      const housing = opts.find((o) => o.id === 'expense-housing-alice')
      expect(housing).toBeDefined()
      // Current deduction: min(2000 × 0.15, 800) = 300
      // Gap: 800 - 300 = 500
      expect(housing!.estimated_savings).toBe(500)
    })
  })

  describe('branch coverage — Cat B activity year factor', () => {
    it('applies activity year reduction factor in Cat B regime suggestion', () => {
      const h = makeHousehold({
        members: [
          {
            name: 'Bob',
            birth_year: 1990,
            cat_b_start_year: 2026,
            incomes: [
              {
                category: 'B',
                gross: 40000,
                cat_b_income_code: 1519,
              },
            ],
            deductions: [],
            special_regimes: [],
          },
        ],
      })
      const result = makeResult(h, makeScenario([makePerson({ gross_income: 40000 })]))
      const opts = generateProactiveOptimizations(h, result)
      const catBRegime = opts.find((o) => o.id === 'cat-b-regime-bob')
      expect(catBRegime).toBeDefined()
      // coefficient = 0.75 (1519 unknown → default), factor for year 1 = 0.5
      // simplifiedTaxable = 40000 × 0.75 × 0.5 = 15000
      // breakEvenExpenses = 40000 - 15000 = 25000
      expect(catBRegime!.description).toContain('€25000')
    })
  })
})
