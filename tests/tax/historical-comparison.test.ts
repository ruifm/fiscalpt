import { describe, expect, it } from 'vitest'

import type { AnalysisResult, PersonTaxDetail, ScenarioResult } from '@/lib/tax/types'
import { deriveResultsView } from '@/lib/tax/results-view'
import {
  buildHistoricalData,
  buildHistoricalSeriesData,
  getPersonNames,
} from '@/lib/tax/historical-comparison'

function makePerson(name: string, overrides: Partial<PersonTaxDetail> = {}): PersonTaxDetail {
  return {
    name,
    gross_income: 30000,
    taxable_income: 25660,
    irs_before_deductions: 5000,
    deductions_total: 800,
    irs_after_deductions: 4200,
    autonomous_tax: 0,
    solidarity_surcharge: 0,
    specific_deduction: 4104,
    cat_b_acrescimo: 0,
    double_taxation_credit: 0,
    ss_total: 3300,
    withholding_total: 4000,
    irs_jovem_exemption: 0,
    nhr_tax: 0,
    minimo_existencia_applied: false,
    effective_rate_irs: 0.14,
    effective_rate_total: 0.25,
    dependent_deduction_share: 0,
    ascendant_deduction_share: 0,
    disability_deductions: 0,
    ...overrides,
  }
}

function makeScenario(
  label: string,
  filingStatus: ScenarioResult['filing_status'],
  overrides: Partial<ScenarioResult> = {},
): ScenarioResult {
  return {
    label,
    filing_status: filingStatus,
    persons: [makePerson('Rui')],
    total_gross: 60000,
    total_taxable: 51320,
    total_irs: 8000,
    total_ss: 6600,
    total_deductions: 1600,
    total_tax_burden: 14600,
    total_net: 45400,
    effective_rate_irs: 8000 / 60000,
    effective_rate_total: 14600 / 60000,
    ...overrides,
  }
}

function makeResult(year: number, scenario: ScenarioResult): AnalysisResult {
  return {
    year,
    household: {
      year,
      filing_status: scenario.filing_status,
      members: [{ name: 'Rui', incomes: [], deductions: [], special_regimes: [] }],
      dependents: [],
    },
    scenarios: [scenario],
    recommended_scenario: scenario.label,
    optimizations: [],
  }
}

function makeViewEntry(year: number, overrides: Partial<ScenarioResult> = {}) {
  const scenario = makeScenario('Individual', 'single', overrides)
  const result = makeResult(year, scenario)
  return { result, view: deriveResultsView(result) }
}

function makeJointViewEntry(
  year: number,
  currentOverrides: Partial<ScenarioResult> = {},
  optimalOverrides: Partial<ScenarioResult> = {},
) {
  const persons = [
    makePerson('Rui', { withholding_total: 5000, irs_after_deductions: 4000, gross_income: 40000 }),
    makePerson('Micha', {
      withholding_total: 3000,
      irs_after_deductions: 2500,
      gross_income: 30000,
    }),
  ]
  const currentScenario = makeScenario('Conjunta', 'married_joint', {
    persons,
    total_gross: 70000,
    total_irs: 6500,
    total_tax_burden: 13100,
    effective_rate_irs: 6500 / 70000,
    ...currentOverrides,
  })
  const optimalScenario = makeScenario('Separada', 'married_separate', {
    persons,
    total_gross: 70000,
    total_irs: 5500,
    total_tax_burden: 12100,
    effective_rate_irs: 5500 / 70000,
    ...optimalOverrides,
  })
  const result: AnalysisResult = {
    year,
    household: {
      year,
      filing_status: 'married_joint',
      members: [
        { name: 'Rui', incomes: [], deductions: [], special_regimes: [] },
        { name: 'Micha', incomes: [], deductions: [], special_regimes: [] },
      ],
      dependents: [],
    },
    scenarios: [currentScenario, optimalScenario],
    recommended_scenario: 'Separada',
    optimizations: [],
  }
  return { result, view: deriveResultsView(result) }
}

describe('buildHistoricalData', () => {
  it('returns empty array for empty input', () => {
    expect(buildHistoricalData([])).toEqual([])
  })

  it('extracts year, income, irs, rate, and refund from single year', () => {
    const entry = makeViewEntry(2024, {
      total_gross: 50000,
      total_irs: 7500,
      effective_rate_irs: 0.15,
      persons: [makePerson('Rui', { withholding_total: 8000, irs_after_deductions: 7500 })],
    })

    const data = buildHistoricalData([entry])

    expect(data).toHaveLength(1)
    expect(data[0].year).toBe(2024)
    expect(data[0].income).toBe(50000)
    expect(data[0].irs).toBe(7500)
    expect(data[0].rate).toBe(0.15)
    // refund = withholding - total IRS per person
    expect(data[0].refund).toBe(500) // 8000 - 7500
  })

  it('computes refund as positive when withholding exceeds IRS', () => {
    const entry = makeViewEntry(2024, {
      persons: [makePerson('Rui', { withholding_total: 6000, irs_after_deductions: 4000 })],
    })

    const data = buildHistoricalData([entry])

    expect(data[0].refund).toBe(2000)
  })

  it('computes refund as negative when IRS exceeds withholding', () => {
    const entry = makeViewEntry(2024, {
      persons: [makePerson('Rui', { withholding_total: 3000, irs_after_deductions: 5000 })],
    })

    const data = buildHistoricalData([entry])

    expect(data[0].refund).toBe(-2000)
  })

  it('includes NHR tax and autonomous tax in refund calculation', () => {
    const entry = makeViewEntry(2024, {
      persons: [
        makePerson('Rui', {
          withholding_total: 10000,
          irs_after_deductions: 4000,
          autonomous_tax: 1000,
          nhr_tax: 2000,
          solidarity_surcharge: 500,
        }),
      ],
    })

    const data = buildHistoricalData([entry])

    // refund = 10000 - (4000 + 1000 + 500 + 2000 - 0 double_taxation_credit)
    expect(data[0].refund).toBe(2500)
  })

  it('handles multiple persons (joint filing) by summing', () => {
    const persons = [
      makePerson('Rui', { withholding_total: 5000, irs_after_deductions: 4000 }),
      makePerson('Micha', { withholding_total: 3000, irs_after_deductions: 2500 }),
    ]
    const entry = makeViewEntry(2024, {
      total_gross: 80000,
      total_irs: 6500,
      effective_rate_irs: 6500 / 80000,
      persons,
    })

    const data = buildHistoricalData([entry])

    expect(data[0].income).toBe(80000)
    expect(data[0].irs).toBe(6500)
    // refund = (5000-4000) + (3000-2500) = 1500
    expect(data[0].refund).toBe(1500)
  })

  it('preserves year ordering from input', () => {
    const entries = [makeViewEntry(2023), makeViewEntry(2025), makeViewEntry(2024)]

    const data = buildHistoricalData(entries)

    expect(data.map((d) => d.year)).toEqual([2023, 2025, 2024])
  })

  it('uses current scenario values (not optimal)', () => {
    const currentScenario = makeScenario('Conjunta', 'married_joint', {
      total_gross: 70000,
      total_irs: 10000,
      total_tax_burden: 16600,
    })
    const optimalScenario = makeScenario('Separada', 'married_separate', {
      total_gross: 70000,
      total_irs: 8000,
      total_tax_burden: 14600,
    })
    const result: AnalysisResult = {
      year: 2024,
      household: {
        year: 2024,
        filing_status: 'married_joint',
        members: [
          { name: 'Rui', incomes: [], deductions: [], special_regimes: [] },
          { name: 'Micha', incomes: [], deductions: [], special_regimes: [] },
        ],
        dependents: [],
      },
      scenarios: [currentScenario, optimalScenario],
      recommended_scenario: 'Separada',
      optimizations: [],
    }
    const view = deriveResultsView(result)

    const data = buildHistoricalData([{ result, view }])

    // Should use current (joint) scenario, not optimal (separate)
    expect(data[0].income).toBe(70000)
    expect(data[0].irs).toBe(10000)
  })
})

// ─── getPersonNames ──────────────────────────────────────────

describe('getPersonNames', () => {
  it('returns empty array for empty input', () => {
    expect(getPersonNames([])).toEqual([])
  })

  it('returns unique person names across all views', () => {
    const entries = [makeJointViewEntry(2023), makeJointViewEntry(2024)]
    expect(getPersonNames(entries)).toEqual(['Rui', 'Micha'])
  })

  it('returns single name for single-person entries', () => {
    const entries = [makeViewEntry(2023), makeViewEntry(2024)]
    expect(getPersonNames(entries)).toEqual(['Rui'])
  })
})

// ─── buildHistoricalSeriesData ───────────────────────────────

describe('buildHistoricalSeriesData', () => {
  it('returns empty array for empty input', () => {
    expect(buildHistoricalSeriesData([], new Set())).toEqual([])
  })

  it('includes both current and optimized values for amendable years', () => {
    const entry = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry], new Set([2024]))

    expect(data).toHaveLength(1)
    expect(data[0].year).toBe(2024)
    expect(data[0].currentIrs).toBe(entry.view.currentScenario.total_irs)
    expect(data[0].optimizedIrs).toBe(entry.view.optimalScenario.total_irs)
    expect(data[0].amendable).toBe(true)
  })

  it('sets optimized values to null for non-amendable years', () => {
    const entry = makeJointViewEntry(2021)
    const data = buildHistoricalSeriesData([entry], new Set([2024, 2025]))

    expect(data).toHaveLength(1)
    expect(data[0].currentIrs).toBe(entry.view.currentScenario.total_irs)
    expect(data[0].optimizedIrs).toBeNull()
    expect(data[0].optimizedIncome).toBeNull()
    expect(data[0].optimizedRate).toBeNull()
    expect(data[0].optimizedRefund).toBeNull()
    expect(data[0].amendable).toBe(false)
  })

  it('mixes amendable and non-amendable years correctly', () => {
    const entry2021 = makeJointViewEntry(2021)
    const entry2024 = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry2021, entry2024], new Set([2024]))

    expect(data[0].optimizedIrs).toBeNull()
    expect(data[0].amendable).toBe(false)
    expect(data[1].optimizedIrs).toBe(entry2024.view.optimalScenario.total_irs)
    expect(data[1].amendable).toBe(true)
  })

  it('includes income, rate, and refund for both states on amendable years', () => {
    const entry = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry], new Set([2024]))

    expect(data[0].currentIncome).toBe(70000)
    expect(data[0].optimizedIncome).toBe(70000)
    expect(data[0].currentRate).toBe(entry.view.currentScenario.effective_rate_irs)
    expect(data[0].optimizedRate).toBe(entry.view.optimalScenario.effective_rate_irs)
    expect(typeof data[0].currentRefund).toBe('number')
    expect(typeof data[0].optimizedRefund).toBe('number')
  })

  it('filters to a specific person when personName is provided', () => {
    const entry = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry], new Set([2024]), 'Rui')

    expect(data).toHaveLength(1)
    expect(data[0].currentIncome).toBe(40000)
    expect(data[0].currentIrs).toBeCloseTo(4000, 0)
  })

  it('filters to second person when personName is provided', () => {
    const entry = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry], new Set([2024]), 'Micha')

    expect(data).toHaveLength(1)
    expect(data[0].currentIncome).toBe(30000)
    expect(data[0].currentIrs).toBeCloseTo(2500, 0)
  })

  it('handles single-person entries for combined view', () => {
    const entry = makeViewEntry(2024, {
      total_gross: 50000,
      total_irs: 7500,
      effective_rate_irs: 0.15,
      persons: [makePerson('Rui', { withholding_total: 8000, irs_after_deductions: 7500 })],
    })
    const data = buildHistoricalSeriesData([entry], new Set([2024]))

    expect(data[0].currentIncome).toBe(50000)
    expect(data[0].currentIrs).toBe(7500)
    // When already optimal, current === optimized
    expect(data[0].optimizedIrs).toBe(7500)
  })

  it('preserves year ordering from input', () => {
    const entries = [makeJointViewEntry(2023), makeJointViewEntry(2025), makeJointViewEntry(2024)]
    const data = buildHistoricalSeriesData(entries, new Set([2023, 2024, 2025]))
    expect(data.map((d) => d.year)).toEqual([2023, 2025, 2024])
  })

  it('computes refund correctly for combined view', () => {
    const entry = makeJointViewEntry(2024)
    const data = buildHistoricalSeriesData([entry], new Set([2024]))

    // current refund = sum of (withholding - totalIrs) per person
    // Rui: 5000 - 4000 = 1000, Micha: 3000 - 2500 = 500 → 1500
    expect(data[0].currentRefund).toBe(1500)
  })

  it('computes refund correctly for per-person view', () => {
    const entry = makeJointViewEntry(2024)
    const ruiData = buildHistoricalSeriesData([entry], new Set([2024]), 'Rui')
    const michaData = buildHistoricalSeriesData([entry], new Set([2024]), 'Micha')

    // Rui: 5000 - 4000 = 1000
    expect(ruiData[0].currentRefund).toBe(1000)
    // Micha: 3000 - 2500 = 500
    expect(michaData[0].currentRefund).toBe(500)
  })
})
