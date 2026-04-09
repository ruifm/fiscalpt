// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => ({ locale: 'pt' }),
}))

import { TaxChat } from '@/components/tax-chat'
import type { AnalysisResult } from '@/lib/tax/types'

const minimalResult: AnalysisResult = {
  year: 2024,
  household: {
    year: 2024,
    filing_status: 'single',
    members: [],
    dependents: [],
  },
  scenarios: [],
  recommended_scenario: 'separate',
  optimizations: [],
}

describe('TaxChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders chat CTA card with title', () => {
    render(<TaxChat results={[minimalResult]} />)
    expect(screen.getByText('chat.title')).toBeDefined()
  })

  it('renders suggestion chips', () => {
    render(<TaxChat results={[minimalResult]} />)
    // Suggestions are wrapped in quotes (ldquo/rdquo) so use regex
    expect(screen.getByText(/chat\.suggestion1/)).toBeDefined()
    expect(screen.getByText(/chat\.suggestion2/)).toBeDefined()
    expect(screen.getByText(/chat\.suggestion3/)).toBeDefined()
  })

  it('renders trust badges', () => {
    render(<TaxChat results={[minimalResult]} />)
    expect(screen.getByText('chat.trustEngine')).toBeDefined()
    expect(screen.getByText('chat.trustAi')).toBeDefined()
    expect(screen.getByText('chat.trustPrivacy')).toBeDefined()
  })

  it('renders CTA description', () => {
    render(<TaxChat results={[minimalResult]} />)
    expect(screen.getByText('chat.ctaDescription')).toBeDefined()
  })
})
