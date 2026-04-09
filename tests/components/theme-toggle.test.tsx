// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockSetTheme = vi.fn()
let mockResolvedTheme = 'light'

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme, setTheme: mockSetTheme }),
}))

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}))

import { ThemeToggle } from '@/components/theme-toggle'
import { trackEvent } from '@/lib/analytics'

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolvedTheme = 'light'
  })

  it('shows dark label in light mode', async () => {
    render(<ThemeToggle />)
    await act(() => Promise.resolve())
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('theme.dark')
  })

  it('shows light label after mount in dark mode', async () => {
    mockResolvedTheme = 'dark'
    render(<ThemeToggle />)
    await act(() => Promise.resolve())
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('theme.light')
  })

  it('toggles from light to dark on click', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await act(() => Promise.resolve())

    await user.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
    expect(trackEvent).toHaveBeenCalledWith('theme_changed', { theme: 'dark' })
  })

  it('toggles from dark to light on click', async () => {
    mockResolvedTheme = 'dark'
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await act(() => Promise.resolve())

    await user.click(screen.getByRole('button'))
    expect(mockSetTheme).toHaveBeenCalledWith('light')
    expect(trackEvent).toHaveBeenCalledWith('theme_changed', { theme: 'light' })
  })
})
