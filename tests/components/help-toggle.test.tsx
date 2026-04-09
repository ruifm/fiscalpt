// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

import { HelpToggle } from '@/components/document-upload/help-toggle'

describe('HelpToggle', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders collapsed by default', () => {
    render(<HelpToggle>Hidden content</HelpToggle>)
    expect(screen.getByText('upload.howToGet')).toBeDefined()
    expect(screen.queryByText('Hidden content')).toBeNull()
  })

  it('expands on click to show children', async () => {
    const user = userEvent.setup()
    render(<HelpToggle>Visible now</HelpToggle>)

    await user.click(screen.getByText('upload.howToGet'))
    expect(screen.getByText('Visible now')).toBeDefined()
  })

  it('collapses again on second click', async () => {
    const user = userEvent.setup()
    render(<HelpToggle>Toggle me</HelpToggle>)

    const button = screen.getByText('upload.howToGet')
    await user.click(button)
    expect(screen.getByText('Toggle me')).toBeDefined()

    await user.click(button)
    expect(screen.queryByText('Toggle me')).toBeNull()
  })

  it('sets aria-expanded correctly', async () => {
    const user = userEvent.setup()
    render(<HelpToggle>Content</HelpToggle>)

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-expanded')).toBe('false')

    await user.click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })
})
