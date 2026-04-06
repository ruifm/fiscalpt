import { describe, it, expect } from 'vitest'
import { buildChatSystemPrompt } from '@/lib/chat-context'
import type { AnalysisResult, Household } from '@/lib/tax/types'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'

// ─── Fixtures ─────────────────────────────────────────────────

function makeHousehold(overrides?: Partial<Household>): Household {
  return {
    year: 2024,
    filing_status: 'married_joint',
    members: [
      {
        name: 'João Silva',
        nif: '123456789',
        birth_year: 1985,
        incomes: [{ category: 'A', gross: 30000, withholding: 5000 }],
        deductions: [
          { category: 'general', amount: 250 },
          { category: 'health', amount: 400 },
        ],
        special_regimes: [],
      },
      {
        name: 'Maria Santos',
        nif: '987654321',
        birth_year: 1990,
        incomes: [{ category: 'A', gross: 25000, withholding: 4000 }],
        deductions: [{ category: 'general', amount: 250 }],
        special_regimes: ['irs_jovem'],
        irs_jovem_year: 3,
      },
    ],
    dependents: [{ name: 'Pedro Silva', birth_year: 2020 }],
    ...overrides,
  }
}

function makeResult(overrides?: Partial<AnalysisResult>): AnalysisResult {
  const household = makeHousehold()
  return {
    year: 2024,
    household,
    scenarios: [
      {
        label: 'Tributação Conjunta',
        filing_status: 'married_joint',
        persons: [
          {
            name: 'João Silva',
            gross_income: 30000,
            taxable_income: 22550,
            irs_before_deductions: 4500,
            deductions_total: 650,
            irs_after_deductions: 3850,
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
            effective_rate_irs: 0.1283,
            effective_rate_total: 0.2383,
            dependent_deduction_share: 300,
            ascendant_deduction_share: 0,
            disability_deductions: 0,
          },
          {
            name: 'Maria Santos',
            gross_income: 25000,
            taxable_income: 18550,
            irs_before_deductions: 3200,
            deductions_total: 250,
            irs_after_deductions: 2950,
            autonomous_tax: 0,
            solidarity_surcharge: 0,
            specific_deduction: 4104,
            cat_b_acrescimo: 0,
            double_taxation_credit: 0,
            ss_total: 2750,
            withholding_total: 4000,
            irs_jovem_exemption: 2000,
            nhr_tax: 0,
            minimo_existencia_applied: false,
            effective_rate_irs: 0.118,
            effective_rate_total: 0.228,
            dependent_deduction_share: 300,
            ascendant_deduction_share: 0,
            disability_deductions: 0,
          },
        ],
        total_gross: 55000,
        total_taxable: 41100,
        total_irs: 6800,
        total_ss: 6050,
        total_deductions: 900,
        total_tax_burden: 12850,
        total_net: 42150,
        effective_rate_irs: 0.1236,
        effective_rate_total: 0.2336,
      },
    ],
    recommended_scenario: 'Tributação Conjunta',
    optimizations: [
      {
        id: 'ppr-maximize-joao',
        title: 'Maximizar PPR',
        description: 'Investir mais em PPR para atingir o teto da dedução.',
        estimated_savings: 150,
      },
    ],
    joint_vs_separate_savings: 350,
    ...overrides,
  }
}

function makeReport(): ActionableReport {
  return {
    year: 2024,
    recommendations: [
      {
        id: 'filing-2024',
        category: 'filing',
        priority: 'high',
        title: 'Opte por Tributação Conjunta',
        summary: 'Poupa €350 com tributação conjunta.',
        steps: [
          {
            order: 1,
            title: 'Portal das Finanças',
            description: 'Submeta declaração conjunta.',
            portal_path: 'https://irs.portaldasfinancas.gov.pt',
            estimated_impact: 350,
          },
        ],
        total_savings: 350,
      },
    ],
    total_savings: 350,
    current_filing: 'Tributação Separada',
    optimal_filing: 'Tributação Conjunta',
  }
}

// ─── Tests ────────────────────────────────────────────────────

describe('buildChatSystemPrompt', () => {
  describe('PII redaction', () => {
    it('replaces member names with Contribuinte A/B labels', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).not.toContain('João Silva')
      expect(prompt).not.toContain('Maria Santos')
      expect(prompt).toContain('Contribuinte A')
      expect(prompt).toContain('Contribuinte B')
    })

    it('removes NIFs from the prompt', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).not.toContain('123456789')
      expect(prompt).not.toContain('987654321')
    })

    it('replaces dependent names', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).not.toContain('Pedro Silva')
      expect(prompt).toContain('Dependente 1')
    })

    it('uses consistent labels across all sections', () => {
      const prompt = buildChatSystemPrompt({
        results: [makeResult()],
        locale: 'pt',
        recommendations: [makeReport()],
      })
      // "Contribuinte A" should appear in both inputs and results sections
      const countA = (prompt.match(/Contribuinte A/g) ?? []).length
      expect(countA).toBeGreaterThanOrEqual(2)
    })
  })

  describe('locale-aware root prompt', () => {
    it('uses European Portuguese instructions for pt locale', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toContain('português europeu')
      expect(prompt).toMatch(/[Nn]unca.*[Bb]rasil/)
    })

    it('uses English instructions for en locale', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'en' })
      expect(prompt).toContain('English')
      expect(prompt).not.toContain('português europeu')
    })

    it('defaults to pt when no locale provided', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()] })
      expect(prompt).toContain('português europeu')
    })
  })

  describe('structured sections', () => {
    it('includes household inputs section', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      // Should contain filing status
      expect(prompt).toContain('married_joint')
      // Should contain income amounts
      expect(prompt).toContain('30000')
      expect(prompt).toContain('25000')
      // Should contain deduction categories
      expect(prompt).toContain('general')
      expect(prompt).toContain('health')
    })

    it('includes scenario results section', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      // Should contain scenario label
      expect(prompt).toContain('Tributação Conjunta')
      // Should contain tax totals
      expect(prompt).toContain('6800')
      expect(prompt).toContain('42150')
      // Should contain effective rates
      expect(prompt).toMatch(/12[.,]36/)
    })

    it('includes optimizations section', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toContain('PPR')
      expect(prompt).toContain('150')
    })

    it('includes recommended scenario', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toContain('Tributação Conjunta')
    })

    it('includes joint vs separate savings when present', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toContain('350')
    })
  })

  describe('recommendations', () => {
    it('includes actionable recommendations when provided', () => {
      const prompt = buildChatSystemPrompt({
        results: [makeResult()],
        locale: 'pt',
        recommendations: [makeReport()],
      })
      expect(prompt).toContain('Opte por Tributação Conjunta')
      expect(prompt).toContain('Poupa €350')
      expect(prompt).toContain('Portal das Finanças')
    })

    it('works without recommendations', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      // Should not error, still have other sections
      expect(prompt).toContain('Contribuinte A')
    })
  })

  describe('special regimes', () => {
    it('includes IRS Jovem info when active', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toContain('irs_jovem')
      expect(prompt).toMatch(/[Aa]no.*3|year.*3/)
    })

    it('includes NHR info when active', () => {
      const result = makeResult()
      result.household.members[0].special_regimes = ['nhr']
      result.household.members[0].nhr_start_year = 2020
      const prompt = buildChatSystemPrompt({ results: [result], locale: 'pt' })
      expect(prompt).toContain('nhr')
      expect(prompt).toContain('2020')
    })
  })

  describe('multi-year', () => {
    it('includes data for multiple years', () => {
      const r2024 = makeResult()
      const r2025 = makeResult({ year: 2025 })
      r2025.household.year = 2025
      const prompt = buildChatSystemPrompt({ results: [r2024, r2025], locale: 'pt' })
      expect(prompt).toContain('2024')
      expect(prompt).toContain('2025')
    })
  })

  describe('core instructions', () => {
    it('instructs the LLM to explain, not compute', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toMatch(/EXPLAIN|[Ee]xplic/)
      expect(prompt).toMatch(/determin[ií]stic/i)
    })

    it('forbids inventing numbers', () => {
      const prompt = buildChatSystemPrompt({ results: [makeResult()], locale: 'pt' })
      expect(prompt).toMatch(/[Nn]unca.*invent|[Nn]ever.*invent/)
    })
  })
})
