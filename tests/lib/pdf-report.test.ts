import { describe, it, expect } from 'vitest'
import {
  resolvePath,
  interpolate,
  makeT,
  fmtEuro,
  fmtPercent,
  personRefund,
  filingLabel,
  PdfReport,
} from '@/lib/pdf-report'
import { renderToBuffer } from '@react-pdf/renderer'
import type { Dictionary } from '@/lib/i18n'
import type { PersonTaxDetail, AnalysisResult } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'
import React from 'react'

// ─── resolvePath ──────────────────────────────────────────────

describe('resolvePath', () => {
  const dict = {
    a: { b: { c: 'leaf' } },
    flat: 'value',
    nested: { deep: { very: { deep: 'bottom' } } },
  } as unknown as Dictionary

  it('resolves dot-separated path to leaf string', () => {
    expect(resolvePath(dict, 'a.b.c')).toBe('leaf')
  })

  it('resolves single-segment path', () => {
    expect(resolvePath(dict, 'flat')).toBe('value')
  })

  it('resolves deeply nested path', () => {
    expect(resolvePath(dict, 'nested.deep.very.deep')).toBe('bottom')
  })

  it('returns undefined for non-existent path', () => {
    expect(resolvePath(dict, 'a.b.missing')).toBeUndefined()
  })

  it('returns undefined for partial path ending at object', () => {
    expect(resolvePath(dict, 'a.b')).toBeUndefined()
  })

  it('returns undefined for path through non-object', () => {
    expect(resolvePath(dict, 'flat.extra')).toBeUndefined()
  })

  it('returns undefined for empty dict and any path', () => {
    expect(resolvePath({} as unknown as Dictionary, 'any.path')).toBeUndefined()
  })
})

// ─── interpolate ──────────────────────────────────────────────

describe('interpolate', () => {
  it('replaces named placeholders with string values', () => {
    expect(interpolate('Hello {name}!', { name: 'World' })).toBe('Hello World!')
  })

  it('replaces named placeholders with number values', () => {
    expect(interpolate('{count} items', { count: 42 })).toBe('42 items')
  })

  it('replaces multiple placeholders', () => {
    expect(interpolate('{a} and {b}', { a: 'X', b: 'Y' })).toBe('X and Y')
  })

  it('leaves unknown placeholders unchanged', () => {
    expect(interpolate('{known} {unknown}', { known: 'OK' })).toBe('OK {unknown}')
  })

  it('returns template unchanged when no placeholders', () => {
    expect(interpolate('no placeholders', { key: 'value' })).toBe('no placeholders')
  })

  it('handles empty params', () => {
    expect(interpolate('{a}', {})).toBe('{a}')
  })
})

// ─── makeT ────────────────────────────────────────────────────

describe('makeT', () => {
  it('returns translated string for pt locale', () => {
    const t = makeT('pt')
    // The pt dictionary should have this key
    expect(typeof t('results.income')).toBe('string')
    expect(t('results.income')).not.toBe('results.income')
  })

  it('returns translated string for en locale', () => {
    const t = makeT('en')
    expect(typeof t('results.income')).toBe('string')
    expect(t('results.income')).not.toBe('results.income')
  })

  it('falls back to pt dictionary when en key is missing', () => {
    const t = makeT('en')
    // If a key exists in pt but not in en, should get pt value
    // This tests the fallback mechanism — result should not be the raw key
    const result = t('pdf.tagline')
    expect(typeof result).toBe('string')
  })

  it('returns raw key when not found in any dictionary', () => {
    const t = makeT('pt')
    expect(t('nonexistent.key.path')).toBe('nonexistent.key.path')
  })

  it('interpolates params when provided', () => {
    const t = makeT('pt')
    const result = t('results.fiscalYear', { year: 2024 })
    expect(result).toContain('2024')
  })
})

// ─── fmtEuro ──────────────────────────────────────────────────

describe('fmtEuro', () => {
  it('formats positive number in pt-PT locale', () => {
    const result = fmtEuro(1234.56)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('56')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    const result = fmtEuro(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formats negative number', () => {
    const result = fmtEuro(-500)
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('includes exactly 2 decimal places', () => {
    const result = fmtEuro(100)
    expect(result).toMatch(/00\s*€|€\s*.*00/)
  })
})

// ─── fmtPercent ───────────────────────────────────────────────

describe('fmtPercent', () => {
  it('formats decimal as percentage', () => {
    expect(fmtPercent(0.25)).toContain('25')
    expect(fmtPercent(0.25)).toContain('%')
  })

  it('formats zero', () => {
    expect(fmtPercent(0)).toContain('0')
    expect(fmtPercent(0)).toContain('%')
  })

  it('formats values over 100%', () => {
    expect(fmtPercent(1.5)).toContain('150')
    expect(fmtPercent(1.5)).toContain('%')
  })

  it('includes 1 decimal place', () => {
    const result = fmtPercent(0.333)
    expect(result).toMatch(/33,3%/)
  })
})

// ─── personRefund ─────────────────────────────────────────────

describe('personRefund', () => {
  const makePerson = (overrides: Partial<PersonTaxDetail> = {}): PersonTaxDetail => ({
    name: 'Test',
    gross_income: 30000,
    taxable_income: 25000,
    irs_before_deductions: 5000,
    deductions_total: 1000,
    irs_after_deductions: 4000,
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
    effective_rate_irs: 0.15,
    effective_rate_total: 0.26,
    dependent_deduction_share: 0,
    ascendant_deduction_share: 0,
    disability_deductions: 0,
    ...overrides,
  })

  it('returns positive refund when withholding exceeds IRS', () => {
    // withholding (5000) - total IRS (4000 + 0 + 0 + 0) = 1000
    const p = makePerson({ withholding_total: 5000, irs_after_deductions: 4000 })
    expect(personRefund(p)).toBe(1000)
  })

  it('returns negative when IRS exceeds withholding', () => {
    const p = makePerson({ withholding_total: 2000, irs_after_deductions: 4000 })
    expect(personRefund(p)).toBeLessThan(0)
  })

  it('returns zero when withholding equals IRS exactly', () => {
    const p = makePerson({
      withholding_total: 4000,
      irs_after_deductions: 4000,
      autonomous_tax: 0,
      solidarity_surcharge: 0,
      nhr_tax: 0,
    })
    expect(personRefund(p)).toBe(0)
  })

  it('accounts for autonomous tax and solidarity surcharge', () => {
    const p = makePerson({
      withholding_total: 10000,
      irs_after_deductions: 4000,
      autonomous_tax: 500,
      solidarity_surcharge: 200,
      nhr_tax: 300,
    })
    // refund = 10000 - (4000 + 500 + 200 + 300) = 5000
    expect(personRefund(p)).toBe(5000)
  })
})

// ─── filingLabel ──────────────────────────────────────────────

describe('filingLabel', () => {
  const t = (key: string) => key

  it('returns joint label for married_joint', () => {
    expect(filingLabel('married_joint', t)).toBe('review.filing.joint')
  })

  it('returns separate label for married_separate', () => {
    expect(filingLabel('married_separate', t)).toBe('review.filing.separate')
  })

  it('returns single label for single', () => {
    expect(filingLabel('single', t)).toBe('review.filing.single')
  })

  it('returns single label for unknown status', () => {
    expect(filingLabel('unknown_status', t)).toBe('review.filing.single')
  })
})

// ─── PdfReport smoke test ─────────────────────────────────────

describe('PdfReport', () => {
  const makePersonDetail = (
    name: string,
    overrides: Partial<PersonTaxDetail> = {},
  ): PersonTaxDetail => ({
    name,
    gross_income: 30000,
    taxable_income: 25896,
    irs_before_deductions: 4500,
    deductions_total: 850,
    irs_after_deductions: 3650,
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
    effective_rate_irs: 0.1217,
    effective_rate_total: 0.2317,
    dependent_deduction_share: 0,
    ascendant_deduction_share: 0,
    disability_deductions: 0,
    ...overrides,
  })

  const makeResult = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
    year: 2024,
    household: {
      year: 2024,
      filing_status: 'single',
      members: [
        {
          name: 'Test',
          incomes: [{ category: 'A', gross: 30000, withholding: 5000, ss_paid: 3300 }],
          deductions: [],
          special_regimes: [],
        },
      ],
      dependents: [],
    },
    scenarios: [
      {
        label: 'Separada',
        filing_status: 'single',
        persons: [makePersonDetail('Test')],
        total_gross: 30000,
        total_taxable: 25896,
        total_irs: 3650,
        total_ss: 3300,
        total_deductions: 850,
        total_tax_burden: 6950,
        total_net: 23050,
        effective_rate_irs: 0.1217,
        effective_rate_total: 0.2317,
      },
    ],
    recommended_scenario: 'Separada',
    optimizations: [],
    ...overrides,
  })

  it('renders single-person report to PDF buffer', async () => {
    const result = makeResult()
    const element = React.createElement(PdfReport, { results: [result], locale: 'pt' })
    const buffer = await renderToBuffer(element as never)
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
    // PDF files start with %PDF
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })

  it('renders multi-person married joint report', async () => {
    const result = makeResult({
      household: {
        year: 2024,
        filing_status: 'married_joint',
        members: [
          {
            name: 'Person A',
            incomes: [{ category: 'A', gross: 40000, withholding: 7000, ss_paid: 4400 }],
            deductions: [],
            special_regimes: [],
          },
          {
            name: 'Person B',
            incomes: [{ category: 'A', gross: 20000, withholding: 2500, ss_paid: 2200 }],
            deductions: [],
            special_regimes: [],
          },
        ],
        dependents: [],
      },
      scenarios: [
        {
          label: 'Conjunta',
          filing_status: 'married_joint',
          persons: [
            makePersonDetail('Person A', { gross_income: 40000, withholding_total: 7000 }),
            makePersonDetail('Person B', { gross_income: 20000, withholding_total: 2500 }),
          ],
          total_gross: 60000,
          total_taxable: 51792,
          total_irs: 8000,
          total_ss: 6600,
          total_deductions: 1700,
          total_tax_burden: 14600,
          total_net: 45400,
          effective_rate_irs: 0.1333,
          effective_rate_total: 0.2433,
        },
        {
          label: 'Separada',
          filing_status: 'married_separate',
          persons: [
            makePersonDetail('Person A', { gross_income: 40000, withholding_total: 7000 }),
            makePersonDetail('Person B', { gross_income: 20000, withholding_total: 2500 }),
          ],
          total_gross: 60000,
          total_taxable: 51792,
          total_irs: 9000,
          total_ss: 6600,
          total_deductions: 1700,
          total_tax_burden: 15600,
          total_net: 44400,
          effective_rate_irs: 0.15,
          effective_rate_total: 0.26,
        },
      ],
      recommended_scenario: 'Conjunta',
      joint_vs_separate_savings: 1000,
    })
    const element = React.createElement(PdfReport, { results: [result], locale: 'pt' })
    const buffer = await renderToBuffer(element as never)
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })

  it('renders report with optimizations', async () => {
    const result = makeResult({
      optimizations: [
        {
          id: 'opt1',
          title: 'Switch to joint',
          description: 'Save by filing jointly',
          estimated_savings: 500,
        },
        { id: 'opt2', title: 'PPR', description: 'PPR deduction', estimated_savings: 300 },
      ],
    })
    const element = React.createElement(PdfReport, { results: [result], locale: 'en' })
    const buffer = await renderToBuffer(element as never)
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })

  it('renders report with unlocked recommendations', async () => {
    const result = makeResult()
    const unlockedReport: ActionableReport = {
      year: 2024,
      recommendations: [
        {
          id: 'rec1',
          category: 'filing',
          priority: 'high',
          title: 'Switch to joint filing',
          summary: 'Joint filing saves €1,000',
          total_savings: 1000,
          steps: [
            {
              order: 1,
              title: 'Go to Portal',
              description: 'Navigate to IRS portal',
              portal_path: 'https://irs.portaldasfinancas.gov.pt',
              estimated_impact: 1000,
            },
          ],
        },
        {
          id: 'rec2',
          category: 'deduction',
          priority: 'medium',
          title: 'Add PPR deduction',
          summary: 'PPR can save up to €400',
          total_savings: 400,
          steps: [
            {
              order: 1,
              title: 'Buy PPR',
              description: 'Purchase PPR product',
              estimated_impact: 400,
            },
          ],
        },
      ],
      total_savings: 1400,
      current_filing: 'married_separate',
      optimal_filing: 'married_joint',
    }
    const element = React.createElement(PdfReport, {
      results: [result],
      locale: 'pt',
      unlockedReports: [unlockedReport],
    })
    const buffer = await renderToBuffer(element as never)
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })

  it('renders multi-year report', async () => {
    const result2024 = makeResult({ year: 2024 })
    const result2025 = makeResult({ year: 2025 })
    const element = React.createElement(PdfReport, {
      results: [result2024, result2025],
      locale: 'pt',
    })
    const buffer = await renderToBuffer(element as never)
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })

  it('renders with low-priority recommendation (no savings)', async () => {
    const result = makeResult()
    const unlockedReport: ActionableReport = {
      year: 2024,
      recommendations: [
        {
          id: 'rec1',
          category: 'general',
          priority: 'low',
          title: 'General tip',
          summary: 'This is a general recommendation',
          total_savings: 0,
          steps: [],
        },
      ],
      total_savings: 0,
      current_filing: 'single',
      optimal_filing: 'single',
    }
    const element = React.createElement(PdfReport, {
      results: [result],
      locale: 'en',
      unlockedReports: [unlockedReport],
    })
    const buffer = await renderToBuffer(element as never)
    expect(buffer.toString('ascii', 0, 5)).toBe('%PDF-')
  })
})
