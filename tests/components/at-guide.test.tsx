// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/i18n', () => ({
  useT: () => (key: string) => key,
}))

vi.mock('next/image', () => ({
  /* eslint-disable jsx-a11y/alt-text, @next/next/no-img-element */
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

import { ATGuide } from '@/components/at-guide'

describe('ATGuide', () => {
  it('renders portal link with external href', () => {
    render(
      <ATGuide
        url="https://example.com/portal"
        urlLabel="Abrir Portal"
        steps={[]}
      />,
    )
    const link = screen.getByRole('link', { name: /Abrir Portal/ })
    expect(link.getAttribute('href')).toBe('https://example.com/portal')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('renders flat steps with captions and step numbers', () => {
    render(
      <ATGuide
        url="https://example.com"
        urlLabel="Portal"
        steps={[
          { screenshot: '/img/step1.png', width: 800, height: 600, caption: 'Step one' },
          { screenshot: '/img/step2.png', width: 800, height: 600, caption: 'Step two' },
        ]}
      />,
    )
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('Step one')).toBeDefined()
    expect(screen.getByText('Step two')).toBeDefined()
  })

  it('renders grouped sections with section titles', () => {
    render(
      <ATGuide
        url="https://example.com"
        urlLabel="Portal"
        sections={[
          {
            title: 'Section A',
            steps: [
              { screenshot: '/img/a1.png', width: 800, height: 600, caption: 'A step 1' },
            ],
          },
          {
            title: 'Section B',
            steps: [
              { screenshot: '/img/b1.png', width: 800, height: 600, caption: 'B step 1' },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByText('Section A')).toBeDefined()
    expect(screen.getByText('Section B')).toBeDefined()
    expect(screen.getByText('A step 1')).toBeDefined()
    expect(screen.getByText('B step 1')).toBeDefined()
  })

  it('renders step images with alt text', () => {
    render(
      <ATGuide
        url="https://example.com"
        urlLabel="Portal"
        steps={[
          { screenshot: '/img/step1.png', width: 800, height: 600, caption: 'Login step' },
        ]}
      />,
    )
    const img = screen.getByAltText('Login step')
    expect(img).toBeDefined()
    expect(img.getAttribute('src')).toBe('/img/step1.png')
  })
})
