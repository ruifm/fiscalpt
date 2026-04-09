// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

import { ResultsSkeleton } from '@/components/results-skeleton'

describe('ResultsSkeleton', () => {
  it('renders a loading status region', () => {
    render(<ResultsSkeleton />)
    const status = screen.getByRole('status')
    expect(status).toBeDefined()
    expect(status.textContent).toContain('skeleton.calculating')
  })

  it('renders skeleton cards', () => {
    const { container } = render(<ResultsSkeleton />)
    // Skeleton elements use data-slot="skeleton" or a common class
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(5)
  })

  it('has a spinning indicator', () => {
    render(<ResultsSkeleton />)
    const spinner = screen.getByRole('status').querySelector('[aria-hidden="true"]')
    expect(spinner).not.toBeNull()
  })
})
