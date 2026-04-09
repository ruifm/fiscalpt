import { describe, it, expect } from 'vitest'
import { buildProjectedHousehold, estimateProjectedRetentions } from '@/lib/tax/projection'
import type {
  AnalysisResult,
  Household,
  Income,
  PersonTaxDetail,
  ScenarioResult,
} from '@/lib/tax/types'

function makeHousehold(overrides?: Partial<Household>): Household {
  return {
    year: 2025,
    filing_status: 'married_joint',
    members: [
      {
        name: 'Alice',
        nif: '123456789',
        birth_year: 1990,
        incomes: [{ category: 'A', gross: 40000, withholding: 8000, ss_paid: 4400 }],
        deductions: [{ category: 'general', amount: 250 }],
        special_regimes: ['irs_jovem'],
        irs_jovem_year: 3,
      },
      {
        name: 'Bob',
        nif: '987654321',
        birth_year: 1988,
        incomes: [
          {
            category: 'B',
            gross: 25000,
            withholding: 3000,
            ss_paid: 2000,
            cat_b_income_code: 403,
            cat_b_activity_year: 1,
          },
        ],
        deductions: [{ category: 'health', amount: 500 }],
        special_regimes: ['nhr'],
        nhr_start_year: 2022,
      },
    ],
    dependents: [{ name: 'Charlie', birth_year: 2020 }],
    ascendants: [{ name: 'Grandma', birth_year: 1950, income: 3000 }],
    ...overrides,
  }
}

describe('buildProjectedHousehold', () => {
  it('bumps year by 1 and sets projected flag', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.year).toBe(2026)
    expect(projected.projected).toBe(true)
  })

  it('preserves filing_status, dependents, ascendants', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.filing_status).toBe('married_joint')
    expect(projected.dependents).toEqual(h.dependents)
    expect(projected.ascendants).toEqual(h.ascendants)
  })

  it('preserves member names, NIFs, birth years, deductions', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.members[0].name).toBe('Alice')
    expect(projected.members[0].nif).toBe('123456789')
    expect(projected.members[0].birth_year).toBe(1990)
    expect(projected.members[0].deductions).toEqual(h.members[0].deductions)
    expect(projected.members[1].name).toBe('Bob')
  })

  it('strips withholding and ss_paid from incomes', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    for (const member of projected.members) {
      for (const income of member.incomes) {
        expect(income.withholding).toBeUndefined()
        expect(income.ss_paid).toBeUndefined()
      }
    }
  })

  it('preserves gross income and category metadata', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.members[0].incomes[0].category).toBe('A')
    expect(projected.members[0].incomes[0].gross).toBe(40000)
    expect(projected.members[1].incomes[0].category).toBe('B')
    expect(projected.members[1].incomes[0].cat_b_income_code).toBe(403)
  })

  it('increments irs_jovem_year by 1', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.members[0].irs_jovem_year).toBe(4)
  })

  it('derives irs_jovem_year from irs_jovem_first_work_year', () => {
    const h = makeHousehold()
    h.members[0].irs_jovem_first_work_year = 2020
    h.members[0].irs_jovem_year = undefined
    const projected = buildProjectedHousehold(h)
    // projectedYear = 2026, firstWorkYear = 2020 → year 7
    expect(projected.members[0].irs_jovem_year).toBe(7)
    expect(projected.members[0].special_regimes).toContain('irs_jovem')
  })

  it('drops IRS Jovem when derived year from first_work_year exceeds max', () => {
    const h = makeHousehold()
    h.members[0].irs_jovem_first_work_year = 2015
    // projectedYear = 2026, firstWorkYear = 2015 → year 12 > 10
    const projected = buildProjectedHousehold(h)
    expect(projected.members[0].irs_jovem_year).toBeUndefined()
    expect(projected.members[0].special_regimes).not.toContain('irs_jovem')
  })

  it('increments cat_b_activity_year from 1st to 2nd year', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.members[1].incomes[0].cat_b_activity_year).toBe(2)
  })

  it('drops cat_b_activity_year when 2nd year advances past new-activity period', () => {
    const h = makeHousehold()
    h.members[1].incomes[0].cat_b_activity_year = 2
    const projected = buildProjectedHousehold(h)
    expect(projected.members[1].incomes[0].cat_b_activity_year).toBeUndefined()
  })

  it('drops cat_b_activity_year=0 (3rd+ year) — no new-activity reduction in projection', () => {
    const h = makeHousehold()
    h.members[1].incomes[0].cat_b_activity_year = 0
    const projected = buildProjectedHousehold(h)
    expect(projected.members[1].incomes[0].cat_b_activity_year).toBeUndefined()
  })

  it('preserves NHR regime and start year unchanged', () => {
    const h = makeHousehold()
    const projected = buildProjectedHousehold(h)
    expect(projected.members[1].special_regimes).toContain('nhr')
    expect(projected.members[1].nhr_start_year).toBe(2022)
  })

  it('drops IRS Jovem when year exceeds max benefit years (10 for 2025+ regime)', () => {
    const h = makeHousehold()
    h.members[0].irs_jovem_year = 10
    const projected = buildProjectedHousehold(h)
    expect(projected.members[0].irs_jovem_year).toBeUndefined()
    expect(projected.members[0].special_regimes).not.toContain('irs_jovem')
  })

  it('applies adjusted gross incomes by NIF', () => {
    const h = makeHousehold()
    const adjustedIncomes = new Map<string, Income[]>([
      ['123456789', [{ category: 'A', gross: 50000 }]],
    ])
    const projected = buildProjectedHousehold(h, adjustedIncomes)
    expect(projected.members[0].incomes[0].gross).toBe(50000)
    // Bob's income unchanged
    expect(projected.members[1].incomes[0].gross).toBe(25000)
  })

  it('does not mutate the original household', () => {
    const h = makeHousehold()
    const originalYear = h.year
    const originalGross = h.members[0].incomes[0].gross
    buildProjectedHousehold(h)
    expect(h.year).toBe(originalYear)
    expect(h.members[0].incomes[0].gross).toBe(originalGross)
    expect(h.projected).toBeUndefined()
  })

  it('handles single person household', () => {
    const h = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'Solo',
          nif: '111222333',
          birth_year: 1995,
          incomes: [{ category: 'A', gross: 30000, withholding: 5000 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(h)
    expect(projected.year).toBe(2026)
    expect(projected.members).toHaveLength(1)
    expect(projected.members[0].incomes[0].withholding).toBeUndefined()
  })
})

// ─── Retention estimation ────────────────────────────────────

function makePersonDetail(overrides?: Partial<PersonTaxDetail>): PersonTaxDetail {
  return {
    name: 'Test',
    gross_income: 40000,
    taxable_income: 35600,
    irs_before_deductions: 5000,
    deductions_total: 1000,
    irs_after_deductions: 4000,
    autonomous_tax: 0,
    solidarity_surcharge: 0,
    specific_deduction: 4400,
    cat_b_acrescimo: 0,
    double_taxation_credit: 0,
    ss_total: 4400,
    withholding_total: 8000,
    irs_jovem_exemption: 0,
    nhr_tax: 0,
    minimo_existencia_applied: false,
    effective_rate_irs: 0.1,
    effective_rate_total: 0.21,
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
  return {
    label: 'test',
    filing_status: 'married_joint',
    persons,
    total_gross: totalGross,
    total_taxable: persons.reduce((s, p) => s + p.taxable_income, 0),
    total_irs: totalIrs,
    total_ss: persons.reduce((s, p) => s + p.ss_total, 0),
    total_deductions: persons.reduce((s, p) => s + p.deductions_total, 0),
    total_tax_burden: totalIrs + persons.reduce((s, p) => s + p.ss_total, 0),
    total_net: totalGross - totalIrs - persons.reduce((s, p) => s + p.ss_total, 0),
    effective_rate_irs: totalGross > 0 ? totalIrs / totalGross : 0,
    effective_rate_total:
      totalGross > 0 ? (totalIrs + persons.reduce((s, p) => s + p.ss_total, 0)) / totalGross : 0,
  }
}

function makeResult(primary: Household, scenario: ScenarioResult): AnalysisResult {
  return {
    year: primary.year,
    household: primary,
    scenarios: [scenario],
    recommended_scenario: scenario.label,
    optimizations: [],
  }
}

describe('estimateProjectedRetentions', () => {
  it('estimates Cat A withholding using primary effective rate', () => {
    const primary = makeHousehold({
      members: [
        {
          name: 'Alice',
          nif: '123456789',
          birth_year: 1990,
          // 20% effective withholding rate
          incomes: [{ category: 'A', gross: 40000, withholding: 8000, ss_paid: 4400 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)
    // Change projected gross to 50000
    projected.members[0].incomes[0].gross = 50000

    const personDetail = makePersonDetail({ name: 'Alice', withholding_total: 8000 })
    const scenario = makeScenario([personDetail])
    const result = makeResult(primary, scenario)

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // 50000 × (8000/40000) = 10000
    expect(estimated.members[0].incomes[0].withholding).toBe(10000)
  })

  it('estimates Cat A SS at 11%', () => {
    const primary = makeHousehold({
      members: [
        {
          name: 'Alice',
          nif: '123456789',
          birth_year: 1990,
          incomes: [{ category: 'A', gross: 40000, withholding: 8000, ss_paid: 4400 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)
    projected.members[0].incomes[0].gross = 50000

    const personDetail = makePersonDetail()
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // 50000 × 0.11 = 5500
    expect(estimated.members[0].incomes[0].ss_paid).toBe(5500)
  })

  it('estimates Cat B withholding at 25% and includes PPC', () => {
    const primary = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'Bob',
          nif: '987654321',
          birth_year: 1988,
          incomes: [{ category: 'B', gross: 30000, withholding: 7500, ss_paid: 4494 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    // Primary year: coleta_líquida = 4000, withholding = 7500
    // IRS total (irs_after_deductions + autonomous + surcharge + nhr) = 4000
    // PPC base = max(0, 4000 - 7500) = 0 → no PPC
    const personDetail = makePersonDetail({
      name: 'Bob',
      gross_income: 30000,
      irs_after_deductions: 4000,
      autonomous_tax: 0,
      solidarity_surcharge: 0,
      nhr_tax: 0,
      withholding_total: 7500,
    })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // Cat B withholding = 25% × 30000 = 7500 (no PPC since IRS < withholding)
    expect(estimated.members[0].incomes[0].withholding).toBe(7500)
  })

  it('adds PPC when primary coleta exceeds withholding', () => {
    const primary = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'Bob',
          nif: '987654321',
          birth_year: 1988,
          incomes: [{ category: 'B', gross: 50000, withholding: 5000, ss_paid: 7490 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    // Primary year: coleta total = 10000, withholding = 5000
    // PPC base = 10000 - 5000 = 5000
    // PPC = 5000 × 76.5% = 3825
    // Total withholding = 25% × 50000 + 3825 = 12500 + 3825 = 16325
    const personDetail = makePersonDetail({
      name: 'Bob',
      gross_income: 50000,
      irs_after_deductions: 10000,
      autonomous_tax: 0,
      solidarity_surcharge: 0,
      nhr_tax: 0,
      withholding_total: 5000,
    })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // 25% × 50000 + 3825 PPC = 16325
    expect(estimated.members[0].incomes[0].withholding).toBe(16325)
  })

  it('uses 51% PPC rate for first 2 years of Cat B activity', () => {
    const primary = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'Bob',
          nif: '987654321',
          birth_year: 1988,
          incomes: [
            {
              category: 'B',
              gross: 50000,
              withholding: 5000,
              ss_paid: 7490,
              cat_b_activity_year: 1,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    // PPC base = 10000 - 5000 = 5000
    // PPC = 5000 × 51% = 2550 (new activity)
    const personDetail = makePersonDetail({
      name: 'Bob',
      gross_income: 50000,
      irs_after_deductions: 10000,
      autonomous_tax: 0,
      solidarity_surcharge: 0,
      nhr_tax: 0,
      withholding_total: 5000,
    })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // 25% × 50000 + 2550 PPC = 15050
    expect(estimated.members[0].incomes[0].withholding).toBe(15050)
  })

  it('estimates Cat B SS when ss_paid is absent', () => {
    const primary = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'Bob',
          nif: '987654321',
          birth_year: 1988,
          incomes: [{ category: 'B', gross: 30000, withholding: 7500, ss_paid: 4494 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)
    const personDetail = makePersonDetail({ name: 'Bob', withholding_total: 7500 })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // Cat B SS = 70% × 30000 × 21.4% = 4494
    expect(estimated.members[0].incomes[0].ss_paid).toBe(4494)
  })

  it('does not mutate the projected household', () => {
    const primary = makeHousehold()
    const projected = buildProjectedHousehold(primary)
    const origGross = projected.members[0].incomes[0].gross

    const personDetail = makePersonDetail()
    const result = makeResult(
      primary,
      makeScenario([personDetail, makePersonDetail({ name: 'Bob' })]),
    )

    estimateProjectedRetentions(projected, primary, result)
    expect(projected.members[0].incomes[0].withholding).toBeUndefined()
    expect(projected.members[0].incomes[0].gross).toBe(origGross)
  })

  it('handles zero primary withholding gracefully', () => {
    const primary = makeHousehold({
      members: [
        {
          name: 'Alice',
          nif: '123456789',
          birth_year: 1990,
          incomes: [{ category: 'A', gross: 5000, withholding: 0, ss_paid: 550 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    const personDetail = makePersonDetail({ withholding_total: 0, gross_income: 5000 })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    expect(estimated.members[0].incomes[0].withholding).toBe(0)
  })

  it('handles income without primary withholding (e.g. Cat E/F/G)', () => {
    const primary = makeHousehold({
      members: [
        {
          name: 'Alice',
          nif: '123456789',
          birth_year: 1990,
          incomes: [
            { category: 'A', gross: 40000, withholding: 8000, ss_paid: 4400 },
            { category: 'F', gross: 12000 },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    const personDetail = makePersonDetail({ withholding_total: 8000 })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // Cat A: withholding estimated
    expect(estimated.members[0].incomes[0].withholding).toBe(8000)
    // Cat F: no withholding, no SS
    expect(estimated.members[0].incomes[1].withholding).toBeUndefined()
    expect(estimated.members[0].incomes[1].ss_paid).toBeUndefined()
  })

  it('defaults Cat A withholding to 0 when member has no NIF', () => {
    const primary = makeHousehold({
      members: [
        {
          name: 'NoNif',
          birth_year: 1990,
          incomes: [{ category: 'A', gross: 30000, withholding: 6000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    const personDetail = makePersonDetail({ name: 'NoNif', withholding_total: 6000 })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // No NIF → primaryIncomes undefined → effective rate 0 → withholding 0
    expect(estimated.members[0].incomes[0].withholding).toBe(0)
    // SS still estimated at 11%
    expect(estimated.members[0].incomes[0].ss_paid).toBe(3300)
  })

  it('defaults Cat B PPC to 0 when member name has no matching detail', () => {
    const primary = makeHousehold({
      filing_status: 'single',
      members: [
        {
          name: 'UnmatchedName',
          nif: '111222333',
          birth_year: 1990,
          incomes: [
            {
              category: 'B',
              gross: 30000,
              withholding: 7500,
              ss_paid: 4494,
              cat_b_income_code: 1519,
            },
          ],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    })
    const projected = buildProjectedHousehold(primary)

    // PersonTaxDetail uses a different name → no match in primaryDetailByName
    const personDetail = makePersonDetail({ name: 'DifferentName' })
    const result = makeResult(primary, makeScenario([personDetail]))

    const estimated = estimateProjectedRetentions(projected, primary, result)
    // Cat B: 25% base withholding, PPC = 0 (no primaryDetail match)
    expect(estimated.members[0].incomes[0].withholding).toBe(7500) // 30000 × 0.25
  })
})
