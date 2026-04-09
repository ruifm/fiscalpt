// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string, _params?: Record<string, unknown>) => key,
}))

import {
  DeductionSlotCard,
  DeductionSlotsSection,
} from '@/components/document-upload/deduction-slots'
import type { DeductionSlot } from '@/lib/tax/upload-validation'
import type { DeductionsParseResult, ParsedDeductionsPage } from '@/lib/tax/deductions-parser'

function makePageData(overrides: Partial<ParsedDeductionsPage> = {}): ParsedDeductionsPage {
  return {
    nif: '123456789',
    name: 'Rui',
    year: 2024,
    expenses: [],
    ...overrides,
  }
}

function makeSlot(overrides: Partial<DeductionSlot> = {}): DeductionSlot {
  return {
    key: '123-2024',
    nif: '123456789',
    year: 2024,
    role: 'taxpayer',
    hasLiquidacao: false,
    ...overrides,
  }
}

describe('DeductionSlotCard', () => {
  const onPaste = vi.fn()
  const onRemove = vi.fn()
  const nifColorMap = new Map<string, string>()

  beforeEach(() => vi.clearAllMocks())

  it('renders year badge and NIF badge', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('2024')).toBeDefined()
    expect(screen.getByText('NIF 123456789')).toBeDefined()
  })

  it('hides NIF badge when showNif is false', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
        showNif={false}
      />,
    )
    expect(screen.queryByText('NIF 123456789')).toBeNull()
  })

  it('shows textarea when no parsed data', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('shows parsed expenses when entry is provided', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        entry={{
          text: 'raw',
          result: {
            ok: true as const,
            data: makePageData({
              expenses: [
                { category: 'general', expenseAmount: 1000, deductionAmount: 250 },
                { category: 'health', expenseAmount: 500, deductionAmount: 75 },
              ],
            }),
          },
        }}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText(/Rui/)).toBeDefined()
    expect(screen.getByText('upload.deductionCategories.general')).toBeDefined()
    expect(screen.getByText('upload.deductionCategories.health')).toBeDefined()
  })

  it('shows remove button for parsed data', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        entry={{
          text: 'raw',
          result: {
            ok: true as const,
            data: makePageData({
              expenses: [{ category: 'general', expenseAmount: 100, deductionAmount: 35 }],
            }),
          },
        }}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'upload.removePastedData' }),
    ).toBeDefined()
  })

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup()
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        entry={{
          text: 'raw',
          result: {
            ok: true as const,
            data: makePageData({
              expenses: [{ category: 'general', expenseAmount: 100, deductionAmount: 35 }],
            }),
          },
        }}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'upload.removePastedData' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('shows error message when parse fails', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot()}
        entry={{
          text: 'bad data',
          result: { ok: false, error: 'Invalid format' },
        }}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('Invalid format')).toBeDefined()
  })

  it('shows portal link with correct URL', () => {
    render(
      <DeductionSlotCard
        slot={makeSlot({ year: 2025 })}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain('ano=2025')
    expect(link.getAttribute('target')).toBe('_blank')
  })
})

describe('DeductionSlotsSection', () => {
  const onPaste = vi.fn()
  const onRemove = vi.fn()
  const nifColorMap = new Map<string, string>()
  const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>()

  beforeEach(() => vi.clearAllMocks())

  it('returns null when slots is empty', () => {
    const { container } = render(
      <DeductionSlotsSection
        title="Test"
        roleDescription={null}
        slots={[]}
        pastedDeductions={pastedDeductions}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders title and required badge for mandatory slots', () => {
    render(
      <DeductionSlotsSection
        title="Contribuinte"
        roleDescription={null}
        slots={[makeSlot()]}
        pastedDeductions={pastedDeductions}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('Contribuinte')).toBeDefined()
    expect(screen.getByText('upload.required')).toBeDefined()
  })

  it('shows optional badge when all slots have liquidacao', () => {
    render(
      <DeductionSlotsSection
        title="Extra"
        roleDescription={null}
        slots={[makeSlot({ hasLiquidacao: true, role: 'dependent' })]}
        pastedDeductions={pastedDeductions}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )
    expect(screen.getByText('upload.optional')).toBeDefined()
  })

  it('toggles content on click', async () => {
    const user = userEvent.setup()
    const slot = makeSlot()
    render(
      <DeductionSlotsSection
        title="Toggle Test"
        roleDescription={null}
        slots={[slot]}
        pastedDeductions={pastedDeductions}
        nifColorMap={nifColorMap}
        onPaste={onPaste}
        onRemove={onRemove}
      />,
    )

    // Default open — should show slot content
    expect(screen.getByRole('textbox')).toBeDefined()

    // Click to collapse
    await user.click(screen.getByText('Toggle Test'))
    expect(screen.queryByRole('textbox')).toBeNull()
  })
})
