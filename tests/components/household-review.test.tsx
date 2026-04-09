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
}))

import { HouseholdReview } from '@/components/household-review'
import type { Household, ValidationIssue } from '@/lib/tax/types'

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
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
    dependents: [{ name: 'Filho', birth_year: 2022 }],
    ...overrides,
  }
}

describe('HouseholdReview', () => {
  const onConfirm = vi.fn()
  const onBack = vi.fn()

  beforeEach(() => vi.clearAllMocks())

  it('renders page title and subtitle', () => {
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByText('review.pageTitle')).toBeDefined()
    expect(screen.getByText('review.pageSubtitle')).toBeDefined()
  })

  it('renders member name', () => {
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByText('Rui')).toBeDefined()
  })

  it('renders dependent info', () => {
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByText('Filho')).toBeDefined()
    expect(screen.getByText(/2022/)).toBeDefined()
  })

  it('displays error issues with alert role', () => {
    const issues: ValidationIssue[] = [
      { severity: 'error', message: 'Missing income data', code: 'MISSING_INCOME' },
    ]
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={issues}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('Missing income data')).toBeDefined()
  })

  it('displays warning issues', () => {
    const issues: ValidationIssue[] = [
      { severity: 'warning', message: 'Consider IRS Jovem', code: 'IRS_JOVEM' },
    ]
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={issues}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByText('Consider IRS Jovem')).toBeDefined()
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    await user.click(screen.getByRole('button', { name: /common\.back/ }))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    await user.click(screen.getByRole('button', { name: /review\.confirmAndCalculate/ }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('renders edit button', () => {
    render(
      <HouseholdReview
        household={makeHousehold()}
        issues={[]}
        onConfirm={onConfirm}
        onBack={onBack}
      />,
    )
    expect(screen.getByRole('button', { name: /review\.edit/ })).toBeDefined()
  })
})
