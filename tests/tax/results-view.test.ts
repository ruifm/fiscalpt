import { describe, expect, it } from 'vitest'

import type { AnalysisResult, Household, PersonTaxDetail, ScenarioResult } from '@/lib/tax/types'
import { deriveResultsView } from '@/lib/tax/results-view'

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
  totalBurden: number,
): ScenarioResult {
  return {
    label,
    filing_status: filingStatus,
    persons: [makePerson('Rui')],
    total_gross: 60000,
    total_taxable: 51320,
    total_irs: totalBurden - 6600,
    total_ss: 6600,
    total_deductions: 1600,
    total_tax_burden: totalBurden,
    total_net: 60000 - totalBurden,
    effective_rate_irs: (totalBurden - 6600) / 60000,
    effective_rate_total: totalBurden / 60000,
  }
}

function makeResult(
  filingStatus: Household['filing_status'],
  scenarios: ScenarioResult[],
): AnalysisResult {
  return {
    year: 2024,
    household: {
      year: 2024,
      filing_status: filingStatus,
      members: [{ name: 'Rui', incomes: [], deductions: [], special_regimes: [] }],
      dependents: [],
    },
    scenarios,
    recommended_scenario: scenarios.reduce((a, b) =>
      a.total_tax_burden <= b.total_tax_burden ? a : b,
    ).label,
    optimizations: [],
  }
}

describe('deriveResultsView', () => {
  it('single filer: current equals optimal', () => {
    const scenario = makeScenario('Tributação Individual', 'single', 12000)
    const result = makeResult('single', [scenario])

    const view = deriveResultsView(result)

    expect(view.isAlreadyOptimal).toBe(true)
    expect(view.savings).toBe(0)
    expect(view.currentScenario).toBe(view.optimalScenario)
  })

  it('married filing jointly when joint is optimal', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 10000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 12000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result)

    expect(view.isAlreadyOptimal).toBe(true)
    expect(view.savings).toBe(0)
    expect(view.currentScenario.filing_status).toBe('married_joint')
    expect(view.optimalScenario.filing_status).toBe('married_joint')
  })

  it('married filing jointly when separate is optimal → shows savings', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 12000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 10000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result)

    expect(view.isAlreadyOptimal).toBe(false)
    expect(view.savings).toBe(2000)
    expect(view.currentScenario.filing_status).toBe('married_joint')
    expect(view.optimalScenario.filing_status).toBe('married_separate')
  })

  it('married filing separately when joint is optimal → shows savings', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 10000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 12000)
    const result = makeResult('married_separate', [joint, separate])

    const view = deriveResultsView(result)

    expect(view.isAlreadyOptimal).toBe(false)
    expect(view.savings).toBe(2000)
    expect(view.currentScenario.filing_status).toBe('married_separate')
    expect(view.optimalScenario.filing_status).toBe('married_joint')
  })

  it('married filing separately when separate is also optimal', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 14000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 11000)
    const result = makeResult('married_separate', [joint, separate])

    const view = deriveResultsView(result)

    expect(view.isAlreadyOptimal).toBe(true)
    expect(view.savings).toBe(0)
  })

  it('equal burden scenarios: current is already optimal (no savings)', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 10000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 10000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result)

    // When burdens are equal, joint wins (<=) and matches filing_status
    expect(view.isAlreadyOptimal).toBe(true)
    expect(view.savings).toBe(0)
  })

  it('savings is never negative', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 10000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 12000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result)

    // current is already optimal, savings = max(0, 10000 - 10000) = 0
    expect(view.savings).toBeGreaterThanOrEqual(0)
  })

  it('falls back to first scenario when filing_status not matched', () => {
    // Edge case: scenarios don't include the filing_status
    const scenario = makeScenario('Tributação Individual', 'single', 12000)
    const result = makeResult('married_joint', [scenario])

    const view = deriveResultsView(result)

    expect(view.currentScenario).toBe(scenario)
    expect(view.optimalScenario).toBe(scenario)
    expect(view.isAlreadyOptimal).toBe(true)
  })

  it('non-amendable year: optimal equals current regardless of scenarios', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 12000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 10000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result, { amendable: false })

    expect(view.currentScenario.filing_status).toBe('married_joint')
    expect(view.optimalScenario.filing_status).toBe('married_joint')
    expect(view.isAlreadyOptimal).toBe(true)
    expect(view.savings).toBe(0)
  })

  it('amendable year: optimal is computed normally', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 12000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 10000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result, { amendable: true })

    expect(view.optimalScenario.filing_status).toBe('married_separate')
    expect(view.isAlreadyOptimal).toBe(false)
    expect(view.savings).toBe(2000)
  })

  it('default (no options): amendable behavior', () => {
    const joint = makeScenario('Tributação Conjunta', 'married_joint', 12000)
    const separate = makeScenario('Tributação Separada', 'married_separate', 10000)
    const result = makeResult('married_joint', [joint, separate])

    const view = deriveResultsView(result)

    expect(view.optimalScenario.filing_status).toBe('married_separate')
    expect(view.savings).toBe(2000)
  })
})
