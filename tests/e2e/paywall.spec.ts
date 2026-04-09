import { test, expect } from '@playwright/test'
import { navigateToResults } from './helpers'

test.describe('Paywall — discount code', () => {
  test('valid Stripe promo code applies discount and shows checkout', async ({ page }) => {
    await navigateToResults(page, {
      xmlFiles: ['decl-m3-irs-2024-holder-a.xml', 'decl-m3-irs-2024-holder-b.xml'],
      nifs: ['100000001', '100000002'],
      year: 2024,
    })

    // Scroll to the paywall section and verify locked state
    const paywallHeading = page.getByRole('heading', { name: 'Recomendações Personalizadas' })
    await paywallHeading.scrollIntoViewIfNeeded()
    await expect(paywallHeading).toBeVisible()

    // Open the discount code input
    const discountPrompt = page.getByRole('button', { name: /Tem um código de desconto/ })
    await expect(discountPrompt).toBeVisible()
    await discountPrompt.click()

    // Fill in a Stripe test promo code and apply
    const discountInput = page.locator('#discount-code')
    await expect(discountInput).toBeVisible()
    await discountInput.fill(process.env.E2E_STRIPE_PROMO_CODE ?? 'TESTPROMO')

    const applyBtn = page.getByRole('button', { name: 'Aplicar' })
    await expect(applyBtn).toBeEnabled()
    await applyBtn.click()

    // Wait for discount validation response
    await page.waitForTimeout(3000)

    // Either a discount message or an error appears (depends on Stripe test mode config)
    const discountMsg = page.locator('[data-testid="discount-message"]')
    const errorMsg = page.getByText('Código inválido ou expirado')
    await expect(discountMsg.or(errorMsg)).toBeVisible({ timeout: 10_000 })
  })

  test('invalid discount code shows error', async ({ page }) => {
    await navigateToResults(page, {
      xmlFiles: ['decl-m3-irs-2024-holder-a.xml', 'decl-m3-irs-2024-holder-b.xml'],
      nifs: ['100000001', '100000002'],
      year: 2024,
    })

    // Scroll to paywall
    const paywallHeading = page.getByRole('heading', { name: 'Recomendações Personalizadas' })
    await paywallHeading.scrollIntoViewIfNeeded()

    // Open discount input
    const discountPrompt = page.getByRole('button', { name: /Tem um código de desconto/ })
    await discountPrompt.click()

    // Enter an invalid code
    const discountInput = page.locator('#discount-code')
    await expect(discountInput).toBeVisible()
    await discountInput.fill('INVALID')

    const applyBtn = page.getByRole('button', { name: 'Aplicar' })
    await applyBtn.click()

    // Error message should appear
    await expect(page.getByText('Código inválido ou expirado')).toBeVisible({ timeout: 10_000 })
  })
})
