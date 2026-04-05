import { describe, it, expect } from 'vitest'
import { validateAgainstLiquidacao } from '@/lib/tax/pdf-extractor'
import type { LiquidacaoParsed } from '@/lib/tax/pdf-extractor'
import type { ScenarioResult } from '@/lib/tax/types'

function makeScenario(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    label: 'test',
    filing_status: 'single',
    persons: [],
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
    rendimentoGlobal: 50000,
    coletaTotal: 10000,
    taxaEfetiva: 0.2,
    ...overrides,
  }
}

describe('validateAgainstLiquidacao', () => {
  it('should pass when calculation matches liquidação exactly', () => {
    const result = validateAgainstLiquidacao(makeLiquidacao(), makeScenario())

    expect(result.isValid).toBe(true)
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('should pass when values are within €1 tolerance', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ rendimentoGlobal: 50000.8 }),
      makeScenario({ total_gross: 50000 }),
    )

    expect(result.isValid).toBe(true)
    const grossComparison = result.comparison.find((c) => c.field === 'Rendimento Global')
    expect(grossComparison?.withinTolerance).toBe(true)
  })

  it('should error when rendimento global differs beyond tolerance', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ rendimentoGlobal: 52000 }),
      makeScenario({ total_gross: 50000 }),
    )

    expect(result.isValid).toBe(false)
    const errors = result.issues.filter((i) => i.severity === 'error')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].code).toBe('LIQUIDACAO_MISMATCH')
    expect(errors[0].message).toContain('Rendimento global')
  })

  it('should error when coleta total differs beyond tolerance', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ coletaTotal: 12000 }),
      makeScenario({ total_irs: 10000 }),
    )

    expect(result.isValid).toBe(false)
    expect(result.issues.some((i) => i.code === 'LIQUIDACAO_MISMATCH')).toBe(true)
  })

  it('should error when taxa efetiva differs beyond 0.5pp', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ taxaEfetiva: 0.25 }),
      makeScenario({ effective_rate_irs: 0.2 }),
    )

    expect(result.isValid).toBe(false)
    expect(result.issues.some((i) => i.message.includes('Taxa efetiva'))).toBe(true)
  })

  it('should tolerate small rate differences (≤0.5pp)', () => {
    const result = validateAgainstLiquidacao(
      makeLiquidacao({ taxaEfetiva: 0.2035 }),
      makeScenario({ effective_rate_irs: 0.2 }),
    )

    expect(result.isValid).toBe(true)
    const rateComparison = result.comparison.find((c) => c.field === 'Taxa Efetiva')
    expect(rateComparison?.withinTolerance).toBe(true)
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
})
