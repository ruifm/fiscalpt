// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

const captureError = vi.fn()
vi.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => captureError(...args),
}))

import { ErrorBoundary } from '@/components/error-boundary'

function BombComponent({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('boom')
  return <p>All good</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    captureError.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText('error.title')).toBeDefined()
    expect(screen.getByText('error.defaultMessage')).toBeDefined()
    expect(screen.getByText('boom')).toBeDefined()
  })

  it('shows custom fallbackMessage when provided', () => {
    render(
      <ErrorBoundary fallbackMessage="Custom error message">
        <BombComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Custom error message')).toBeDefined()
  })

  it('calls captureError on error', () => {
    render(
      <ErrorBoundary>
        <BombComponent shouldThrow />
      </ErrorBoundary>,
    )
    expect(captureError).toHaveBeenCalledOnce()
    expect(captureError.mock.calls[0][0]).toBeInstanceOf(Error)
    expect(captureError.mock.calls[0][0].message).toBe('boom')
  })

  it('resets and re-renders children on retry click', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    function MaybeThrow() {
      if (shouldThrow) throw new Error('boom')
      return <p>Recovered</p>
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeDefined()

    // Fix the component before retrying
    shouldThrow = false
    await user.click(screen.getByText('error.retry'))

    expect(screen.getByText('Recovered')).toBeDefined()
  })
})
