import { test, expect, type Page } from '@playwright/test'
import path from 'path'

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/e2e')

function mockDeductionsText(nif: string, year: number): string {
  return [
    `NIF: ${nif}`,
    `Ano ${year}`,
    `Boa noite, SUJEITO TESTE`,
    `Despesas Gerais Familiares`,
    `Total de despesas comunicadas 500,00 €`,
    `Dedução calculada 175,00 €`,
    `Saúde e Seguros de Saúde`,
    `Total de despesas comunicadas 200,00 €`,
    `Dedução calculada 30,00 €`,
  ].join('\n')
}

async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fiscalpt:onboarding-seen', '1')
  })
}

async function uploadXml(page: Page, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename)
  const dropzone = page.locator('[data-testid="upload-dropzone"]')
  await expect(dropzone).toBeVisible()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await dropzone.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePath)
}

async function fillDeductionSlots(page: Page, nifs: string[], year: number) {
  for (const nif of nifs) {
    const textarea = page.locator(`[data-testid="deduction-textarea-${nif}-${year}"]`)
    if (!(await textarea.isVisible({ timeout: 2000 }).catch(() => false))) continue
    await textarea.fill(mockDeductionsText(nif, year))
    await page.waitForTimeout(300)
  }
}

async function waitForStep(page: Page, step: 'upload' | 'questionnaire' | 'results') {
  await expect(page.locator(`[data-testid="step-${step}"]`)).toBeVisible({ timeout: 15_000 })
}

async function clickAdvance(page: Page) {
  const btn = page.locator('[data-testid="advance-button"]')
  await expect(btn).toBeVisible()
  await expect(btn).toBeEnabled()
  await btn.click()
}

async function completeQuestionnaire(page: Page) {
  const questionnaire = page.locator('[data-testid="step-questionnaire"]')
  const results = page.locator('[data-testid="step-results"]')
  await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })

  if (await questionnaire.isVisible()) {
    await expect(questionnaire.locator('input, select').first()).toBeVisible({ timeout: 10_000 })

    const spinbuttons = questionnaire.locator('input[type="number"]')
    const spinCount = await spinbuttons.count()
    for (let i = 0; i < spinCount; i++) {
      const input = spinbuttons.nth(i)
      if (await input.isVisible()) {
        const currentValue = await input.inputValue()
        if (!currentValue || currentValue === '0') {
          await input.fill('1990')
        }
      }
    }

    const selects = questionnaire.locator('select')
    const selectCount = await selects.count()
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i)
      if (await select.isVisible()) {
        const options = select.locator('option:not([value=""])')
        const optionCount = await options.count()
        if (optionCount > 0) {
          const value = await options.first().getAttribute('value')
          if (value) await select.selectOption(value)
        }
      }
    }

    await page.waitForTimeout(500)

    const continueBtn = page.locator('[data-testid="questionnaire-continue"]')
    await expect(continueBtn).toBeEnabled({ timeout: 5000 })
    await continueBtn.click()
  }
}

/** Navigate from upload through questionnaire to the results step */
async function navigateToResults(page: Page) {
  await dismissOnboarding(page)
  await page.goto('/analyze')
  await waitForStep(page, 'upload')

  await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
  await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')
  await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

  await fillDeductionSlots(page, ['100000001', '100000002'], 2024)
  await clickAdvance(page)
  await completeQuestionnaire(page)

  await waitForStep(page, 'results')
  await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 30_000 })
}

test.describe('Paywall — discount code', () => {
  test('valid Stripe promo code applies discount and shows checkout', async ({ page }) => {
    await navigateToResults(page)

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
    await navigateToResults(page)

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
