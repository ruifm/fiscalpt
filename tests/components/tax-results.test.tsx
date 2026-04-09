// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT:
    () =>
    (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
  useLocale: () => ({ locale: 'pt' }),
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
}))

vi.mock('@/components/pdf-export-button', () => ({
  PdfExportButton: () => <button>PDF</button>,
}))

vi.mock('@/components/share-results', () => ({
  ShareResults: () => <button>Share</button>,
}))

vi.mock('@/components/tax-chat', () => ({
  TaxChat: () => <div data-testid="tax-chat">Chat</div>,
}))

vi.mock('@/components/recommendations-paywall', () => ({
  RecommendationsPaywall: () => <div data-testid="paywall">Paywall</div>,
}))

vi.mock('@/hooks/use-count-up', () => ({
  AnimatedEuro: ({ value }: { value: number }) => <span>{value}</span>,
}))

import { TaxResults } from '@/components/tax-results'
import type { AnalysisResult, ScenarioResult, PersonTaxDetail } from '@/lib/tax/types'

function makePersonDetail(overrides: Partial<PersonTaxDetail> = {}): PersonTaxDetail {
  return {
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
    ...overrides,
  }
}

function makeScenario(overrides: Partial<ScenarioResult> = {}): ScenarioResult {
  return {
    label: 'Tributação Conjunta',
    filing_status: 'married_joint',
    persons: [makePersonDetail()],
    total_gross: 50000,
    total_taxable: 40000,
    total_irs: 11750,
    total_ss: 5500,
    total_deductions: 250,
    total_tax_burden: 17250,
    total_net: 32750,
    effective_rate_irs: 0.235,
    effective_rate_total: 0.345,
    ...overrides,
  }
}

function makeResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    year: 2024,
    household: {
      year: 2024,
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
      makeScenario({ filing_status: 'married_joint', total_tax_burden: 17250 }),
      makeScenario({
        label: 'Tributação Separada',
        filing_status: 'married_separate',
        total_tax_burden: 19000,
      }),
    ],
    recommended_scenario: 'married_joint',
    optimizations: [],
    ...overrides,
  }
}

describe('TaxResults', () => {
  const onBack = vi.fn()
  const onReset = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders results container', () => {
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    expect(screen.getByTestId('results-container')).toBeDefined()
  })

  it('renders results title', () => {
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    expect(screen.getByText('results.title')).toBeDefined()
  })

  it('renders print button with aria-label', () => {
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    expect(screen.getByRole('button', { name: 'common.print' })).toBeDefined()
  })

  it('renders PDF export and share buttons', () => {
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    expect(screen.getByText('PDF')).toBeDefined()
    expect(screen.getByText('Share')).toBeDefined()
  })

  it('renders back button that calls onBack', async () => {
    const user = userEvent.setup()
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: /common\.back/ }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('renders new analysis button that calls onReset', async () => {
    const user = userEvent.setup()
    render(<TaxResults results={[makeResult()]} onBack={onBack} onReset={onReset} />)
    await user.click(screen.getByRole('button', { name: /common\.newAnalysis/ }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('renders data quality warnings when issues exist', () => {
    render(
      <TaxResults
        results={[makeResult()]}
        issues={[{ severity: 'warning', message: 'Watch out!', code: 'TEST_WARN' }]}
        onBack={onBack}
        onReset={onReset}
      />,
    )
    expect(screen.getByText('Watch out!')).toBeDefined()
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('shows year tabs when multiple years', () => {
    const r1 = makeResult({ year: 2024 })
    const r2 = makeResult({ year: 2025 })
    render(<TaxResults results={[r1, r2]} onBack={onBack} onReset={onReset} />)
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2025').length).toBeGreaterThan(0)
  })
})
