// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLd } from '@/components/json-ld'

describe('JsonLd', () => {
  it('renders script tag with JSON-LD type', () => {
    const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'FiscalPT' }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.textContent!)).toEqual(data)
  })

  it('serializes nested objects', () => {
    const data = { '@type': 'Organization', address: { '@type': 'PostalAddress', country: 'PT' } }
    const { container } = render(<JsonLd data={data} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(JSON.parse(script!.textContent!)).toEqual(data)
  })
})
