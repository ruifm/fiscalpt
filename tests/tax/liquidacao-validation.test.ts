import { describe, it, expect } from 'vitest'
import { validateAgainstLiquidacao } from '@/lib/tax/pdf-extractor'
import type { LiquidacaoParsed } from '@/lib/tax/pdf-extractor'
import type { ScenarioResult, PersonTaxDetail } from '@/lib/tax/types'

function makePersonTaxDetail(overrides: Partial<PersonTaxDetail> = {}): PersonTaxDetail {
  return {
    name: 'Test',
    gross_income: 50000,
    taxable_income: 45000,
    irs_before_deductions: 10000,
    deductions_total: 738,
    irs_after_deductions: 9262,
    autonomous_tax: 0,
    solidarity_surcharge: 0,
    specific_deduction: 4104,
    cat_b_acrescimo: 0,
    double_taxation_credit: 0,
    ss_total: 5500,
    withholding_total: 0,
    irs_jovem_exemption: 0,
    nhr_tax: 0,
    minimo_existencia_applied: false,
    effective_rate_irs: 0.2,
    effective_rate_total: 0.31,
    dependent_deduction_share: 0,
    ascendant_deduction_share: 0,
    disability_deductions: 0,
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    label: 'test',
    filing_status: 'single',
    persons: [makePersonTaxDetail()],
    total_gross: 50000,
    total_taxable: 45000,
    total_irs: 10000,
    total_ss: 5500,
    total_deductions: 738,
    total_tax_burden: 15500,
    total_net: 34500,
    effective_rate_irs: 0.2,
    effective_rate_total: 0.31,
    ...overrides,
  }
}

function makeLiquidacao(overrides: Partial<LiquidacaoParsed> = {}): LiquidacaoParsed {
  return {
    nif: '123456789',
    year: 2024,
    rendimentoGlobal: 45000,
    coletaTotal: 10000,
    taxaEfetiva: 0.2,
    ...overrides,
  }
}

describe('validateAgainstLiquidacao', () => {
  it('should pass when calculation matches liquidação exactly', () => {
    const result = validateAgainstLiquidacao(makeLiquidacao(), makeScenario())

    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('should compare rendimento global against total_taxable, not total_gross', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ rendimentoGlobal: 45000 }),
      makeScenario({ total_gross: 50000, total_taxable: 45000 }),
    )

    expect(result.isValid).toBe(true)
    const grossComparison = result.comparison.find((c) => c.field === 'Rendimento Global')
    expect(grossComparison?.withinTolerance).toBe(true)
    expect(grossComparison?.actual).toBe(45000)
  })

  it('should pass when IRS difference is within €500 threshold', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ coletaTotal: 10400 }),
      makeScenario({ total_irs: 10000 }),
    )

    expect(result.isValid).toBe(true)
    expect(result.issues).toHaveLength(0)
    const coletaComparison = result.comparison.find((c) => c.field === 'Coleta Total')
    expect(coletaComparison?.withinTolerance).toBe(true)
  })

  it('should report info when IRS difference exceeds €500', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ coletaTotal: 11000 }),
      makeScenario({ total_irs: 10000 }),
    )

    expect(result.isValid).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].severity).toBe('info')
    expect(result.issues[0].code).toBe('LIQUIDACAO_MISMATCH')
    expect(result.issues[0].message).toContain('1000€')
  })

  it('should pass when rate difference is within 10pp threshold', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ taxaEfetiva: 0.25 }),
      makeScenario({ effective_rate_irs: 0.2 }),
    )

    expect(result.isValid).toBe(true)
    const rateComparison = result.comparison.find((c) => c.field === 'Taxa Efetiva')
    expect(rateComparison?.withinTolerance).toBe(true)
  })

  it('should report info when rate difference exceeds 10pp', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ taxaEfetiva: 0.35 }),
      makeScenario({ effective_rate_irs: 0.2 }),
    )

    expect(result.isValid).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].severity).toBe('info')
    expect(result.issues[0].message).toContain('15.0pp')
  })

  it('should handle NHR case where total_gross >> total_taxable', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ rendimentoGlobal: 36000 }),
      makeScenario({
        total_gross: 80000,
        total_taxable: 36000,
        persons: [makePersonTaxDetail({ gross_income: 80000, taxable_income: 36000 })],
      }),
    )

    expect(result.isValid).toBe(true)
    const grossComparison = result.comparison.find((c) => c.field === 'Rendimento Global')
    expect(grossComparison?.withinTolerance).toBe(true)
  })

  it('should include comparison entries for all available fields', () => {
    const result = validateAgainstLiquidacao(makeLiquidacao(), makeScenario())

    expect(result.comparison.length).toBe(3)
    expect(result.comparison.map((c) => c.field)).toEqual(
      expect.arrayContaining(['Rendimento Global', 'Coleta Total', 'Taxa Efetiva']),
    )
  })

  it('should skip fields not present in liquidação', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({
        rendimentoGlobal: undefined,
        coletaTotal: undefined,
        taxaEfetiva: undefined,
      }),
      makeScenario(),
    )

    expect(result.isValid).toBe(true)
    expect(result.comparison).toHaveLength(0)
  })

  it('should report both IRS and rate mismatches when both exceed thresholds', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ coletaTotal: 15000, taxaEfetiva: 0.35 }),
      makeScenario({ total_irs: 10000, effective_rate_irs: 0.2 }),
    )

    expect(result.isValid).toBe(false)
    expect(result.issues).toHaveLength(2)
    expect(result.issues.every((i) => i.severity === 'info')).toBe(true)
  })
})
