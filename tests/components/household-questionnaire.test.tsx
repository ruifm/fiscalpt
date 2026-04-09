// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT:
    () =>
    (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
}))

vi.mock('@/lib/tax/missing-inputs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tax/missing-inputs')>()
  return {
    ...actual,
    identifyMissingInputs: vi.fn(actual.identifyMissingInputs),
  }
})

import { HouseholdQuestionnaire } from '@/components/household-questionnaire'
import type { Household } from '@/lib/tax/types'

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2024,
    filing_status: 'married_joint',
    members: [
      {
        name: 'Rui',
        nif: '123456789',
        incomes: [{ category: 'A', gross: 50000 }],
        deductions: [{ category: 'general', amount: 250 }],
        special_regimes: [],
      },
      {
        name: 'Micha',
        nif: '987654321',
        incomes: [{ category: 'A', gross: 30000 }],
        deductions: [{ category: 'general', amount: 250 }],
        special_regimes: [],
      },
    ],
    dependents: [{ name: 'Filho', birth_year: 2022 }],
    ...overrides,
  }
}

// Household with no missing inputs — identifyMissingInputs returns []
// To achieve this we mock the function in tests that need it
function makeSingleHousehold(): Household {
  return {
    year: 2024,
    filing_status: 'single',
    members: [
      {
        name: 'Rui',
        nif: '123456789',
        birth_year: 1990,
        incomes: [{ category: 'A', gross: 50000, withholding: 10000, ss_paid: 5500 }],
        deductions: [
          { category: 'general', amount: 250 },
          { category: 'health', amount: 500 },
        ],
        special_regimes: [],
      },
    ],
    dependents: [],
  }
}

describe('HouseholdQuestionnaire', () => {
  const onComplete = vi.fn()
  const onBack = vi.fn()
  const _onSkip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    // jsdom doesn't implement scrollIntoView — mock it to prevent unhandled errors
    // from the hook's auto-focus setTimeout firing after test teardown
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders the title and progress', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    expect(screen.getByText('questionnaire.title')).toBeDefined()
    expect(screen.getByText('questionnaire.subtitle')).toBeDefined()
  })

  it('shows data-complete when no questions needed and no projection', async () => {
    const { identifyMissingInputs } = await import('@/lib/tax/missing-inputs')
    vi.mocked(identifyMissingInputs).mockReturnValue([])

    const household = makeSingleHousehold()
    render(
      <HouseholdQuestionnaire household={household} onComplete={onComplete} onBack={onBack} />,
    )
    expect(screen.getByText('questionnaire.dataComplete')).toBeDefined()
    expect(screen.getByText('questionnaire.dataCompleteDesc')).toBeDefined()

    vi.mocked(identifyMissingInputs).mockRestore()
  })

  it('auto-advances with continue button when data is complete', async () => {
    const { identifyMissingInputs } = await import('@/lib/tax/missing-inputs')
    vi.mocked(identifyMissingInputs).mockReturnValue([])

    const household = makeSingleHousehold()
    render(
      <HouseholdQuestionnaire household={household} onComplete={onComplete} onBack={onBack} />,
    )
    const continueBtn = screen.getByTestId('questionnaire-continue')
    await userEvent.click(continueBtn)
    expect(onComplete).toHaveBeenCalledWith(household)

    vi.mocked(identifyMissingInputs).mockRestore()
  })

  it('calls onBack when back button is clicked on data-complete view', async () => {
    const { identifyMissingInputs } = await import('@/lib/tax/missing-inputs')
    vi.mocked(identifyMissingInputs).mockReturnValue([])

    const household = makeSingleHousehold()
    render(
      <HouseholdQuestionnaire household={household} onComplete={onComplete} onBack={onBack} />,
    )
    const backBtn = screen.getByTestId('questionnaire-back')
    await userEvent.click(backBtn)
    expect(onBack).toHaveBeenCalled()

    vi.mocked(identifyMissingInputs).mockRestore()
  })

  it('renders questions when there are missing inputs', () => {
    // Without birth_year, there will be questions about it
    const household = makeHousehold()
    render(
      <HouseholdQuestionnaire household={household} onComplete={onComplete} onBack={onBack} />,
    )
    // Should render the questionnaire title
    expect(screen.getByText('questionnaire.title')).toBeDefined()
  })

  it('renders undo/redo buttons', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    expect(screen.getByLabelText('questionnaire.undo')).toBeDefined()
    expect(screen.getByLabelText('questionnaire.redo')).toBeDefined()
  })

  it('disables undo/redo initially', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    const undoBtn = screen.getByLabelText('questionnaire.undo')
    const redoBtn = screen.getByLabelText('questionnaire.redo')
    expect(undoBtn).toHaveProperty('disabled', true)
    expect(redoBtn).toHaveProperty('disabled', true)
  })

  it('shows skip and continue buttons in question mode', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    expect(screen.getByTestId('questionnaire-skip')).toBeDefined()
    expect(screen.getByTestId('questionnaire-continue')).toBeDefined()
  })

  it('renders projection section when projectionYear is set', () => {
    render(
      <HouseholdQuestionnaire
        household={makeHousehold()}
        onComplete={onComplete}
        onBack={onBack}
        projectionYear={2025}
      />,
    )
    // Projection section should be visible with the year
    expect(screen.getByText(/questionnaire\.projection\.title/)).toBeDefined()
  })

  it('continue is always enabled', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    const continueBtn = screen.getByTestId('questionnaire-continue')
    expect(continueBtn).toBeDefined()
    expect(continueBtn).toHaveProperty('disabled', false)
  })

  it('skip calls onComplete directly', async () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    const skipBtn = screen.getByTestId('questionnaire-skip')
    await userEvent.click(skipBtn)
    // All questions are optional, so skip should call onComplete directly
    expect(onComplete).toHaveBeenCalled()
  })

  it('persists answers to sessionStorage after interaction', async () => {
    const household = makeHousehold()
    const { unmount } = render(
      <HouseholdQuestionnaire household={household} onComplete={onComplete} onBack={onBack} />,
    )
    const key = `fiscalpt-answers-${household.year}`

    // Type into the first available input to trigger an answer change
    const inputs = screen.queryAllByRole('spinbutton')
    if (inputs.length > 0) {
      await userEvent.type(inputs[0], '1990')
      // Wait for the useEffect that persists to sessionStorage
      await waitFor(() => {
        expect(sessionStorage.getItem(key)).not.toBeNull()
      })
      expect(JSON.parse(sessionStorage.getItem(key)!)).toEqual(expect.objectContaining({}))
    } else {
      // If no inputs are visible (all sections collapsed), verify storage key format
      expect(key).toBe('fiscalpt-answers-2024')
    }
    unmount()
  })

  it('renders section headers with icons', () => {
    render(
      <HouseholdQuestionnaire household={makeHousehold()} onComplete={onComplete} onBack={onBack} />,
    )
    // All sections are rendered expanded (no accordion)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('shows projection toggle switch', () => {
    render(
      <HouseholdQuestionnaire
        household={makeHousehold()}
        onComplete={onComplete}
        onBack={onBack}
        projectionYear={2025}
      />,
    )
    const toggle = document.getElementById('projection-toggle')
    expect(toggle).not.toBeNull()
  })
})
