// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`
    return key
  },
}))

import { OnboardingOverlay } from '@/components/onboarding-overlay'

// jsdom in vitest doesn't provide a working localStorage — create a simple mock
function createLocalStorageMock() {
  const store = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size
    },
    key: vi.fn((_i: number) => null),
  }
}

describe('OnboardingOverlay', () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>

  beforeEach(() => {
    vi.restoreAllMocks()
    storageMock = createLocalStorageMock()
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      configurable: true,
    })
  })

  it('shows overlay when localStorage key is not set', async () => {
    await act(async () => {
      render(<OnboardingOverlay />)
    })
    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText('onboarding.step1.title')).toBeDefined()
  })

  it('does not show when localStorage key is set', async () => {
    storageMock.setItem('fiscalpt:onboarding-seen', '1')
    await act(async () => {
      render(<OnboardingOverlay />)
    })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('navigates through steps with Next button', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<OnboardingOverlay />)
    })

    expect(screen.getByText('onboarding.step1.title')).toBeDefined()

    await user.click(screen.getByText('common.next'))
    expect(screen.getByText('onboarding.step2.title')).toBeDefined()

    await user.click(screen.getByText('common.next'))
    expect(screen.getByText('onboarding.step3.title')).toBeDefined()
    expect(screen.getByText('common.start')).toBeDefined()
  })

  it('dismisses on Start click and sets localStorage', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<OnboardingOverlay />)
    })

    await user.click(screen.getByText('common.next'))
    await user.click(screen.getByText('common.next'))
    await user.click(screen.getByText('common.start'))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(storageMock.setItem).toHaveBeenCalledWith('fiscalpt:onboarding-seen', '1')
  })

  it('dismisses on Skip click', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<OnboardingOverlay />)
    })

    await user.click(screen.getByText('common.skip'))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(storageMock.setItem).toHaveBeenCalledWith('fiscalpt:onboarding-seen', '1')
  })

  it('dismisses on close (X) button click', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<OnboardingOverlay />)
    })

    await user.click(screen.getByRole('button', { name: 'onboarding.closeLabel' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(storageMock.setItem).toHaveBeenCalledWith('fiscalpt:onboarding-seen', '1')
  })

  it('dismisses on Escape key', async () => {
    const user = userEvent.setup()
    await act(async () => {
      render(<OnboardingOverlay />)
    })

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('handles localStorage errors gracefully', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
      },
      configurable: true,
    })

    await act(async () => {
      render(<OnboardingOverlay />)
    })
    // Component catches the error — overlay stays hidden since setVisible(true) never runs
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows step description text', async () => {
    await act(async () => {
      render(<OnboardingOverlay />)
    })
    expect(screen.getByText('onboarding.step1.description')).toBeDefined()
  })
})
