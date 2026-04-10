// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}:${JSON.stringify(params)}`
    return key
  },
}))

vi.mock('next/dynamic', () => ({
  default: () => {
    const Stub = () => <div data-testid="checkout-form">Checkout</div>
    Stub.displayName = 'DynamicCheckoutForm'
    return Stub
  },
}))

import { RecommendationsPaywall } from '@/components/recommendations-paywall'
import type { AnalysisResult } from '@/lib/tax/types'

function makeResult(year = 2024): AnalysisResult {
  return {
    year,
    household: {
      year,
      filing_status: 'married_joint',
      members: [
        {
          name: 'Rui',
          incomes: [{ category: 'A', gross: 50000 }],
          deductions: [{ category: 'general', amount: 250 }],
          special_regimes: [],
        },
      ],
      dependents: [],
    },
    scenarios: [
      {
        label: 'Tributação Conjunta',
        filing_status: 'married_joint',
        persons: [
          {
            name: 'Rui',
            gross_income: 50000,
            taxable_income: 40000,
            irs_before_deductions: 12000,
            deductions_total: 250,
            irs_after_deductions: 11750,
            autonomous_tax: 0,
            solidarity_surcharge: 0,
            specific_deduction: 4104,
            cat_b_acrescimo: 0,
            double_taxation_credit: 0,
            ss_total: 5500,
            withholding_total: 12000,
            irs_jovem_exemption: 0,
            nhr_tax: 0,
            minimo_existencia_applied: false,
            effective_rate_irs: 0.2,
            effective_rate_total: 0.3,
            dependent_deduction_share: 0,
            ascendant_deduction_share: 0,
            disability_deductions: 0,
          },
        ],
        total_gross: 50000,
        total_taxable: 40000,
        total_irs: 10000,
        total_ss: 5500,
        total_deductions: 250,
        total_tax_burden: 15500,
        total_net: 34500,
        effective_rate_irs: 0.2,
        effective_rate_total: 0.3,
      },
    ],
    recommended_scenario: 'married_joint',
    optimizations: [
      {
        id: 'irs_jovem',
        title: 'Test opt',
        description: 'Consider IRS Jovem',
        estimated_savings: 500,
      },
    ],
  }
}

describe('RecommendationsPaywall', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows locked state with paywall heading when savings > 0', () => {
    render(<RecommendationsPaywall results={[makeResult()]} totalSavings={500} />)
    expect(screen.getByText('paywall.title')).toBeDefined()
    expect(screen.getByText('paywall.unlockPrice')).toBeDefined()
  })

  it('shows optimized state when no savings', () => {
    const result = makeResult()
    result.optimizations = []
    render(<RecommendationsPaywall results={[result]} totalSavings={0} />)
    expect(screen.getByText('paywall.noOptTitle')).toBeDefined()
  })

  it('shows discount code toggle', async () => {
    const user = userEvent.setup()
    render(<RecommendationsPaywall results={[makeResult()]} totalSavings={500} />)
    const discountBtn = screen.getByRole('button', { name: /paywall\.hasDiscount/i })
    expect(discountBtn).toBeDefined()
    await user.click(discountBtn)
    expect(screen.getByPlaceholderText(/paywall\.discountPlaceholder/i)).toBeDefined()
  })
})
