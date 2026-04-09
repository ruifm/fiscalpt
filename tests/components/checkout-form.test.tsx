// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Must mock stripe BEFORE importing the component since
// stripePromise is evaluated at module level
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  EmbeddedCheckoutProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="stripe-provider">{children}</div>
  ),
  EmbeddedCheckout: () => <div data-testid="stripe-checkout">Checkout</div>,
}))

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module registry so stripePromise re-evaluates
    vi.resetModules()
  })

  it('shows unavailable message when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set', async () => {
    // No env var set → stripePromise is null
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const { CheckoutForm } = await import('@/components/checkout-form')

    render(<CheckoutForm analysisId="test-123" onComplete={vi.fn()} />)
    expect(screen.getByText(/Pagamento não disponível/)).toBeDefined()
  })

  it('renders Stripe checkout when key is set', async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_fake'
    const { CheckoutForm } = await import('@/components/checkout-form')

    render(<CheckoutForm analysisId="test-123" onComplete={vi.fn()} />)
    expect(screen.getByTestId('stripe-provider')).toBeDefined()
    expect(screen.getByTestId('stripe-checkout')).toBeDefined()
  })
})
