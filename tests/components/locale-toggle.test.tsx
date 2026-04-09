// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSetLocale = vi.fn()
let currentLocale = 'pt'

vi.mock('@/lib/i18n', () => ({
  useLocale: () => ({ locale: currentLocale, setLocale: mockSetLocale }),
  useT: () => (key: string) => key,
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

import { LocaleToggle } from '@/components/locale-toggle'
import { trackEvent } from '@/lib/analytics'

describe('LocaleToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentLocale = 'pt'
  })

  it('shows next locale label (EN when current is PT)', () => {
    render(<LocaleToggle />)
    expect(screen.getByText('EN')).toBeDefined()
  })

  it('shows PT when current locale is en', () => {
    currentLocale = 'en'
    render(<LocaleToggle />)
    expect(screen.getByText('PT')).toBeDefined()
  })

  it('calls setLocale on click', async () => {
    const user = userEvent.setup()
    render(<LocaleToggle />)

    await user.click(screen.getByRole('button'))
    expect(mockSetLocale).toHaveBeenCalledWith('en')
  })

  it('tracks locale change event', async () => {
    const user = userEvent.setup()
    render(<LocaleToggle />)

    await user.click(screen.getByRole('button'))
    expect(trackEvent).toHaveBeenCalledWith('locale_changed', { from: 'pt', to: 'en' })
  })

  it('has aria-label for accessibility', () => {
    render(<LocaleToggle />)
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('locale.switchToEn')
  })
})
