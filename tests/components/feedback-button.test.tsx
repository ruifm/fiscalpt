// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

import { FeedbackButton } from '@/components/feedback-button'

describe('FeedbackButton', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders closed state with Feedback label', () => {
    render(<FeedbackButton stage="upload" />)
    expect(screen.getByRole('button', { name: 'Enviar feedback' })).toBeDefined()
    expect(screen.getByText('Feedback')).toBeDefined()
  })

  it('opens form on click', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton stage="upload" />)

    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    expect(screen.getByText('Enviar feedback')).toBeDefined()
    expect(screen.getByPlaceholderText('Descreva o problema ou sugestão...')).toBeDefined()
  })

  it('closes form via close button', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton stage="upload" />)

    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))
    expect(screen.getByPlaceholderText('Descreva o problema ou sugestão...')).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    // Should be back to closed state
    expect(screen.queryByPlaceholderText('Descreva o problema ou sugestão...')).toBeNull()
  })

  it('disables submit when message is empty', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton stage="results" />)

    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    const submitBtn = screen.getByRole('button', { name: /Enviar/ })
    expect(submitBtn.hasAttribute('disabled') || submitBtn.getAttribute('aria-disabled')).toBeTruthy()
  })

  it('submits feedback and shows success state', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
    const user = userEvent.setup()
    render(<FeedbackButton stage="questionnaire" />)

    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))

    const textarea = screen.getByPlaceholderText('Descreva o problema ou sugestão...')
    await user.type(textarea, 'Something broke')
    await user.click(screen.getByRole('button', { name: /Enviar/ }))

    await waitFor(() => {
      expect(screen.getByText('Obrigado pelo seu feedback!')).toBeDefined()
    })

    expect(fetchSpy).toHaveBeenCalledWith('/api/report-problem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'Something broke', stage: 'questionnaire' }),
    })
  })

  it('handles fetch failure gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    const user = userEvent.setup()
    render(<FeedbackButton stage="upload" />)

    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))
    await user.type(
      screen.getByPlaceholderText('Descreva o problema ou sugestão...'),
      'test',
    )
    await user.click(screen.getByRole('button', { name: /Enviar/ }))

    // Should still show success (best-effort)
    await waitFor(() => {
      expect(screen.getByText('Obrigado pelo seu feedback!')).toBeDefined()
    })
  })

  it('reopening after success resets sent state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))
    const user = userEvent.setup()
    render(<FeedbackButton stage="upload" />)

    // Open, submit
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))
    await user.type(
      screen.getByPlaceholderText('Descreva o problema ou sugestão...'),
      'msg',
    )
    await user.click(screen.getByRole('button', { name: /Enviar/ }))
    await waitFor(() => {
      expect(screen.getByText('Obrigado pelo seu feedback!')).toBeDefined()
    })

    // Close
    await user.click(screen.getByText('Fechar'))

    // Reopen — should show form, not success
    await user.click(screen.getByRole('button', { name: 'Enviar feedback' }))
    expect(screen.getByPlaceholderText('Descreva o problema ou sugestão...')).toBeDefined()
  })
})
