import { describe, it, expect } from 'vitest'
import { generateActionableRecommendations } from '@/lib/tax/actionable-recommendations'
import type { AnalysisResult, Household, ScenarioResult, Optimization } from '@/lib/tax/types'

// ─── Test Helpers ─────────────────────────────────────────────

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2024,
    filing_status: 'married_separate',
    members: [
      {
        name: 'Titular A',
        incomes: [{ category: 'A', gross: 30000, withholding: 5000, ss_paid: 3300 }],
        deductions: [],
        special_regimes: [],
      },
      {
        name: 'Titular B',
        incomes: [{ category: 'A', gross: 25000, withholding: 4000, ss_paid: 2750 }],
        deductions: [],
        special_regimes: [],
      },
    ],
    dependents: [],
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    label: 'Tributação Separada',
    filing_status: 'married_separate',
    persons: [],
    total_gross: 55000,
    total_taxable: 45000,
    total_irs: 8000,
    total_ss: 6050,
    total_deductions: 1200,
    total_tax_burden: 14050,
    total_net: 40950,
    effective_rate_irs: 0.2555,
    effective_rate_total: 0.2555,
    ...overrides,
  }
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    year: 2024,
    household: makeHousehold(),
    scenarios: [
      makeScenario({
        label: 'Tributação Separada',
        filing_status: 'married_separate',
        total_tax_burden: 14050,
      }),
      makeScenario({
        label: 'Tributação Conjunta',
        filing_status: 'married_joint',
        total_tax_burden: 12500,
      }),
    ],
    recommended_scenario: 'married_joint',
    optimizations: [],
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────

describe('generateActionableRecommendations', () => {
  it('returns a report with year and filing labels', () => {
    const result = makeResult()
    const report = generateActionableRecommendations(result)

    expect(report.year).toBe(2024)
    expect(report.current_filing).toBe('Tributação Separada')
    expect(report.optimal_filing).toBe('Tributação Conjunta')
  })

  it('generates filing status change recommendation when current != optimal', () => {
    const result = makeResult()
    const report = generateActionableRecommendations(result)

    const filingRec = report.recommendations.find((r) => r.category === 'filing')
    expect(filingRec).toBeDefined()
    expect(filingRec!.priority).toBe('high')
    expect(filingRec!.total_savings).toBe(1550)
    expect(filingRec!.steps.length).toBeGreaterThanOrEqual(3)
  })

  it('does NOT generate filing recommendation when current == optimal', () => {
    const result = makeResult({
      household: makeHousehold({ filing_status: 'married_joint' }),
      scenarios: [
        makeScenario({ filing_status: 'married_joint', total_tax_burden: 12500 }),
        makeScenario({ filing_status: 'married_separate', total_tax_burden: 14050 }),
      ],
    })
    const report = generateActionableRecommendations(result)
    const filingRec = report.recommendations.find((r) => r.category === 'filing')
    expect(filingRec).toBeUndefined()
  })

  it('generates IRS Jovem recommendation when savings > 0 and eligible members exist', () => {
    const result = makeResult({
      irs_jovem_savings: 2500,
      household: makeHousehold({
        members: [
          {
            name: 'Titular A',
            birth_year: 1995,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [],
            special_regimes: [],
            irs_jovem_year: 3,
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    const irsJovemRec = report.recommendations.find((r) => r.id.startsWith('irs-jovem'))
    expect(irsJovemRec).toBeDefined()
    expect(irsJovemRec!.total_savings).toBe(2500)
    expect(irsJovemRec!.priority).toBe('high')
  })

  it('does NOT generate IRS Jovem recommendation when no savings', () => {
    const result = makeResult({ irs_jovem_savings: 0 })
    const report = generateActionableRecommendations(result)
    const irsJovemRec = report.recommendations.find((r) => r.id.startsWith('irs-jovem'))
    expect(irsJovemRec).toBeUndefined()
  })

  it('generates NHR recommendation when nhr_savings > 0', () => {
    const result = makeResult({ nhr_savings: 3000 })
    const report = generateActionableRecommendations(result)
    const nhrRec = report.recommendations.find((r) => r.id.startsWith('nhr'))
    expect(nhrRec).toBeDefined()
    expect(nhrRec!.total_savings).toBe(3000)
    expect(nhrRec!.category).toBe('regime')
  })

  it('does NOT generate NHR recommendation when no savings', () => {
    const result = makeResult({ nhr_savings: undefined })
    const report = generateActionableRecommendations(result)
    const nhrRec = report.recommendations.find((r) => r.id.startsWith('nhr'))
    expect(nhrRec).toBeUndefined()
  })

  it('generates deduction recommendations from optimizations', () => {
    const optimizations: Optimization[] = [
      {
        id: 'deduction-ppr',
        title: 'Investir em PPR',
        description: 'Pode poupar com PPR',
        estimated_savings: 400,
      },
      {
        id: 'cat-b-expenses',
        title: 'Despesas Cat. B',
        description: 'Documentar despesas',
        estimated_savings: 200,
      },
    ]

    const result = makeResult({ optimizations })
    const report = generateActionableRecommendations(result)

    const pprRec = report.recommendations.find((r) => r.id === 'deduction-ppr')
    expect(pprRec).toBeDefined()
    expect(pprRec!.category).toBe('deduction')
    expect(pprRec!.total_savings).toBe(400)

    const catBRec = report.recommendations.find((r) => r.id === 'cat-b-expenses')
    expect(catBRec).toBeDefined()
    expect(catBRec!.category).toBe('income')
  })

  it('skips optimizations with zero savings', () => {
    const result = makeResult({
      optimizations: [
        { id: 'zero-opt', title: 'Zero', description: 'No impact', estimated_savings: 0 },
      ],
    })
    const report = generateActionableRecommendations(result)
    expect(report.recommendations.find((r) => r.id === 'zero-opt')).toBeUndefined()
  })

  it('sorts recommendations by savings (highest first)', () => {
    const result = makeResult({
      irs_jovem_savings: 500,
      optimizations: [
        { id: 'opt-big', title: 'Big', description: 'Big opt', estimated_savings: 2000 },
      ],
      household: makeHousehold({
        members: [
          {
            name: 'Titular A',
            birth_year: 1995,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [],
            special_regimes: [],
            irs_jovem_year: 1,
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    const savings = report.recommendations.map((r) => r.total_savings)
    for (let i = 1; i < savings.length; i++) {
      expect(savings[i - 1]).toBeGreaterThanOrEqual(savings[i])
    }
  })

  it('computes total_savings correctly', () => {
    const result = makeResult({
      nhr_savings: 1000,
      optimizations: [{ id: 'opt-a', title: 'A', description: 'A', estimated_savings: 300 }],
    })

    const report = generateActionableRecommendations(result)
    const sum = report.recommendations.reduce((s, r) => s + r.total_savings, 0)
    expect(report.total_savings).toBeCloseTo(sum, 1)
  })

  it('handles single filing (no spouse) gracefully', () => {
    const result = makeResult({
      household: makeHousehold({
        filing_status: 'single',
        members: [
          {
            name: 'Titular',
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [],
            special_regimes: [],
          },
        ],
      }),
      scenarios: [makeScenario({ filing_status: 'single', total_tax_burden: 6000 })],
    })

    const report = generateActionableRecommendations(result)
    expect(report.current_filing).toBe('Tributação Individual')
    expect(report.optimal_filing).toBe('Tributação Individual')
    expect(report.recommendations.find((r) => r.category === 'filing')).toBeUndefined()
  })

  it('includes portal paths in filing recommendation steps', () => {
    const result = makeResult()
    const report = generateActionableRecommendations(result)
    const filingRec = report.recommendations.find((r) => r.category === 'filing')
    const portalSteps = filingRec!.steps.filter((s) => s.portal_path)
    expect(portalSteps.length).toBeGreaterThan(0)
    for (const step of portalSteps) {
      expect(step.portal_path).toContain('portaldasfinancas')
    }
  })

  it('does NOT duplicate filing recommendation when optimizations include joint-filing', () => {
    const result = makeResult({
      optimizations: [
        {
          id: 'joint-filing',
          title: 'Tributação Conjunta',
          description: 'Poupa €1550 com tributação conjunta.',
          estimated_savings: 1550,
        },
        {
          id: 'deduction-ppr',
          title: 'Investir em PPR',
          description: 'Pode poupar com PPR',
          estimated_savings: 200,
        },
      ],
    })

    const report = generateActionableRecommendations(result)
    const filingRecs = report.recommendations.filter(
      (r) => r.id === 'joint-filing' || r.id.startsWith('filing'),
    )
    // Only the detailed filing recommendation from filingStatusRecommendation()
    expect(filingRecs).toHaveLength(1)
    expect(filingRecs[0].category).toBe('filing')
    expect(filingRecs[0].priority).toBe('high')
    // PPR should still be there
    expect(report.recommendations.find((r) => r.id === 'deduction-ppr')).toBeDefined()
  })

  it('returns undefined for IRS Jovem when member already using it and none eligible (L131)', () => {
    const result = makeResult({
      irs_jovem_savings: 1500,
      household: makeHousehold({
        members: [
          {
            name: 'Already Using',
            birth_year: 1996,
            incomes: [{ category: 'A', gross: 30000 }],
            deductions: [],
            special_regimes: ['irs_jovem'],
            // no irs_jovem_year → not in membersEligible
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    expect(report.recommendations.find((r) => r.id.startsWith('irs-jovem'))).toBeUndefined()
  })

  it('returns undefined for IRS Jovem when no target members at all (L141)', () => {
    const result = makeResult({
      irs_jovem_savings: 1000,
      household: makeHousehold({
        year: 2024,
        members: [
          {
            name: 'Old Person',
            birth_year: 1970, // age 54 > 35
            incomes: [{ category: 'A', gross: 40000 }],
            deductions: [],
            special_regimes: [],
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    expect(report.recommendations.find((r) => r.id.startsWith('irs-jovem'))).toBeUndefined()
  })

  it('assigns low priority to deduction optimizations with savings <= 100 (L234)', () => {
    const result = makeResult({
      optimizations: [
        {
          id: 'deduction-small',
          title: 'Small optimization',
          description: 'Tiny saving',
          estimated_savings: 50,
        },
      ],
    })

    const report = generateActionableRecommendations(result)
    const rec = report.recommendations.find((r) => r.id === 'deduction-small')
    expect(rec).toBeDefined()
    expect(rec!.priority).toBe('low')
  })

  it('uses plural form when multiple members eligible for IRS Jovem (L170)', () => {
    const result = makeResult({
      irs_jovem_savings: 3000,
      household: makeHousehold({
        members: [
          {
            name: 'Ana',
            birth_year: 1995,
            incomes: [{ category: 'A', gross: 25000 }],
            deductions: [],
            special_regimes: [],
            irs_jovem_year: 2,
          },
          {
            name: 'Bruno',
            birth_year: 1997,
            incomes: [{ category: 'A', gross: 22000 }],
            deductions: [],
            special_regimes: [],
            irs_jovem_year: 1,
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    const rec = report.recommendations.find((r) => r.id.startsWith('irs-jovem'))
    expect(rec).toBeDefined()
    expect(rec!.summary).toContain('podem')
  })

  it('falls back to scenarios[0] when filing_status matches no scenario (L249-250)', () => {
    const result = makeResult({
      household: makeHousehold({ filing_status: 'single' }),
      scenarios: [
        makeScenario({ filing_status: 'married_separate', total_tax_burden: 14000 }),
        makeScenario({ filing_status: 'married_joint', total_tax_burden: 12000 }),
      ],
    })

    const report = generateActionableRecommendations(result)
    // current falls back to scenarios[0] (married_separate)
    expect(report.current_filing).toBe('Tributação Separada')
  })

  it('IRS Jovem recommendation via age fallback when no member has irs_jovem regime', () => {
    const result = makeResult({
      irs_jovem_savings: 2000,
      household: makeHousehold({
        year: 2024,
        members: [
          {
            name: 'Young Worker',
            birth_year: 1994, // age 30, ≤ 35
            incomes: [{ category: 'A', gross: 30000, withholding: 5000, ss_paid: 3300 }],
            deductions: [],
            special_regimes: [], // no irs_jovem, no nhr
            // no irs_jovem_year
          },
        ],
      }),
    })

    const report = generateActionableRecommendations(result)
    const irsJovem = report.recommendations.find((r) => r.id === 'irs-jovem-2024')
    expect(irsJovem).toBeDefined()
    expect(irsJovem!.total_savings).toBe(2000)
    expect(irsJovem!.steps[1].description).toContain('Young Worker')
  })
})
