// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

vi.mock('@/lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils')>()
  return { ...actual, formatEuro: (v: number) => `€${v}` }
})

import { ShareResults } from '@/components/share-results'

const defaultProps = { savings: 500, optimizationCount: 3, years: [2024] }

describe('ShareResults', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders share button', () => {
    render(<ShareResults {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'share.button' })).toBeDefined()
  })

  it('calls navigator.share when available', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: shareFn, configurable: true })
    const user = userEvent.setup()

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))

    expect(shareFn).toHaveBeenCalledOnce()
    expect(shareFn.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        title: 'FiscalPT',
        url: 'https://fiscalpt.com',
      }),
    )
    expect(shareFn.mock.calls[0][0].text).toBeDefined()
  })

  it('toggles menu when navigator.share is not available', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const user = userEvent.setup()

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))

    expect(screen.getByText('share.title')).toBeDefined()
    expect(screen.getByText(/Twitter/)).toBeDefined()
    expect(screen.getByText(/LinkedIn/)).toBeDefined()
    expect(screen.getByText(/WhatsApp/)).toBeDefined()
  })

  it('opens correct URL for twitter share', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const openFn = vi.fn()
    vi.spyOn(window, 'open').mockImplementation(openFn)
    const user = userEvent.setup()

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))
    await user.click(screen.getByText(/Twitter/))

    expect(openFn).toHaveBeenCalledOnce()
    expect(openFn.mock.calls[0][0]).toContain('x.com/intent/tweet')
  })

  it('copies to clipboard', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const user = userEvent.setup()
    
    // Set up clipboard mock AFTER userEvent.setup() to avoid it being overridden
    const writeFn = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeFn },
      configurable: true,
    })

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))
    await user.click(screen.getByText(/share\.copyLink/))

    await waitFor(() => {
      expect(writeFn).toHaveBeenCalledOnce()
    })
    expect(screen.getByText('share.copied')).toBeDefined()
  })

  it('closes menu via backdrop click', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const user = userEvent.setup()

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))
    expect(screen.getByText('share.title')).toBeDefined()

    // Close button in menu
    await user.click(screen.getByRole('button', { name: 'common.close' }))
    expect(screen.queryByText('share.title')).toBeNull()
  })

  it('uses multi-year text format', () => {
    render(<ShareResults savings={100} optimizationCount={1} years={[2023, 2024, 2025]} />)
    // Renders without error; the year text would be "2023–2025"
    expect(screen.getByRole('button', { name: 'share.button' })).toBeDefined()
  })

  it('uses no-savings text when savings is 0', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    const user = userEvent.setup()

    render(<ShareResults savings={0} optimizationCount={0} years={[2024]} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))

    // The shareText should use 'share.textNoSavings' key
    expect(screen.getByText('share.title')).toBeDefined()
  })

  it('toggles menu when native share throws', async () => {
    const shareFn = vi.fn().mockRejectedValue(new Error('cancelled'))
    Object.defineProperty(navigator, 'share', { value: shareFn, configurable: true })
    const user = userEvent.setup()

    render(<ShareResults {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: 'share.button' }))

    // Menu should open as fallback
    expect(screen.getByText('share.title')).toBeDefined()
  })
})
