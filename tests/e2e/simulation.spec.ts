import { test, expect, type Page } from '@playwright/test'

async function fillBirthYear(page: Page, label: string, year: string) {
  const input = page.locator(`input[id="birth-year-${label}"]`)
  await input.fill(year)
}

async function fillGrossCatA(page: Page, label: string, amount: string) {
  const input = page.locator(`input[id="gross-a-${label}"]`)
  await input.fill(amount)
}

async function fillGrossCatB(page: Page, label: string, amount: string) {
  const input = page.locator(`input[id="gross-b-${label}"]`)
  await input.fill(amount)
}

async function clickCalculate(page: Page) {
  await page.locator('[data-testid="simulation-calculate"]').click()
}

async function waitForResults(page: Page) {
  await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 15_000 })
}

test.describe('Simulação Rápida', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simulacao')
  })

  test('page loads with form', async ({ page }) => {
    await expect(page.locator('[data-testid="simulation-form"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText(/simulação/i)
  })

  test('single filer — basic Cat A income produces results', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')
    await clickCalculate(page)
    await waitForResults(page)

    // Should show euro amounts
    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
  })

  test('married couple — shows results with scenario comparison', async ({ page }) => {
    // Switch to married
    await page.getByRole('button', { name: /casado|married/i }).click()

    // Fill person A
    await fillBirthYear(page, 'Sujeito Passivo A', '1985')
    await fillGrossCatA(page, 'Sujeito Passivo A', '35000')

    // Fill person B
    await fillBirthYear(page, 'Sujeito Passivo B', '1988')
    await fillGrossCatA(page, 'Sujeito Passivo B', '20000')

    await clickCalculate(page)
    await waitForResults(page)

    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
  })

  test('IRS Jovem eligible person — shows savings', async ({ page }) => {
    // Young person born 1998 (age 27 in 2025) — IRS Jovem eligible
    await fillBirthYear(page, 'Contribuinte', '1998')
    await fillGrossCatA(page, 'Contribuinte', '25000')
    await clickCalculate(page)
    await waitForResults(page)

    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
    // Should show savings banner (IRS Jovem applied in optimized scenario)
    await expect(results.getByText(/poupança/i).first()).toBeVisible()
  })

  test('Cat B — fill freelance income', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1985')
    await fillGrossCatA(page, 'Contribuinte', '20000')

    await fillGrossCatB(page, 'Contribuinte', '15000')

    await clickCalculate(page)
    await waitForResults(page)

    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
  })

  test('validation — empty form shows errors', async ({ page }) => {
    await clickCalculate(page)

    // Should show validation errors
    await expect(page.locator('.text-destructive').first()).toBeVisible()
    // Results should not appear
    await expect(page.locator('[data-testid="results-container"]')).not.toBeVisible()
  })

  test('mode toggle — link to Análise Personalizada', async ({ page }) => {
    const analyzeLink = page.getByRole('link', { name: /personalizada|análise/i })
    await expect(analyzeLink).toBeVisible()
    await expect(analyzeLink).toHaveAttribute('href', '/analyze')
  })

  test('conversion CTAs appear after results', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')
    await clickCalculate(page)
    await waitForResults(page)

    // Should show conversion CTA to full analysis
    await expect(page.getByText(/resultados mais precisos/i).first()).toBeVisible()
  })

  test('NHR toggle — applies flat rate', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1985')
    await fillGrossCatA(page, 'Contribuinte', '50000')

    // Toggle NHR by clicking the label text
    await page.getByText(/residente não habitual/i).click()

    await clickCalculate(page)
    await waitForResults(page)

    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
  })

  test('dependents — add children via steppers', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1985')
    await fillGrossCatA(page, 'Contribuinte', '30000')

    // Add 2 children >6 years old (use exact label)
    const over6Increase = page.getByRole('button', { name: 'Aumentar Filhos > 6 anos' })
    await over6Increase.click()
    await over6Increase.click()

    await clickCalculate(page)
    await waitForResults(page)

    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText(/€/)
  })
})

test.describe('Landing page — dual CTAs', () => {
  test('hero has simulation and analysis CTAs', async ({ page }) => {
    await page.goto('/')

    const simLink = page.getByRole('link', { name: /simulação rápida|quick simulation/i })
    const analyzeLink = page.getByRole('link', { name: /análise personalizada|personalized/i })

    await expect(simLink).toBeVisible()
    await expect(analyzeLink).toBeVisible()
    await expect(simLink).toHaveAttribute('href', '/simulacao')
    await expect(analyzeLink).toHaveAttribute('href', '/analyze')
  })
})

test.describe('Simulação Rápida — localStorage persistence', () => {
  test('form state survives page refresh', async ({ page }) => {
    await page.goto('/simulacao')

    // Fill form
    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')

    // Refresh
    await page.reload()

    // Form state should be restored
    const birthInput = page.locator('input[id="birth-year-Contribuinte"]')
    await expect(birthInput).toHaveValue('1990')
    const incomeInput = page.locator('input[id="gross-a-Contribuinte"]')
    await expect(incomeInput).toHaveValue('30000')
  })

  test('results survive page refresh', async ({ page }) => {
    await page.goto('/simulacao')

    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')
    await clickCalculate(page)
    await waitForResults(page)

    // Refresh
    await page.reload()

    // Results should still be visible
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-testid="results-container"]')).toContainText(/€/)
  })

  test('back clears results but keeps form', async ({ page }) => {
    await page.goto('/simulacao')

    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')
    await clickCalculate(page)
    await waitForResults(page)

    // Click "Voltar" (back) button — use data-testid area for results navigation
    const resultsContainer = page.locator('[data-testid="results-container"]')
    await resultsContainer
      .getByRole('button', { name: /^voltar$/i })
      .first()
      .click()

    // Form should be visible with data preserved
    await expect(page.locator('[data-testid="simulation-form"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[id="birth-year-Contribuinte"]')).toHaveValue('1990')
    await expect(page.locator('input[id="gross-a-Contribuinte"]')).toHaveValue('30000')

    // Results should not be visible
    await expect(page.locator('[data-testid="results-container"]')).not.toBeVisible()
  })

  test('reset clears both form and results', async ({ page }) => {
    await page.goto('/simulacao')

    await fillBirthYear(page, 'Contribuinte', '1990')
    await fillGrossCatA(page, 'Contribuinte', '30000')
    await clickCalculate(page)
    await waitForResults(page)

    // Click "Nova análise" (reset) button — inside results area
    const resultsContainer = page.locator('[data-testid="results-container"]')
    await resultsContainer
      .getByRole('button', { name: /nova análise|new analysis/i })
      .first()
      .click()

    // Form should be visible with empty values
    await expect(page.locator('[data-testid="simulation-form"]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[id="birth-year-Contribuinte"]')).toHaveValue('')
    await expect(page.locator('input[id="gross-a-Contribuinte"]')).toHaveValue('')
  })
})

test.describe('/analyze — UX callouts', () => {
  test('"no documents?" callout visible when no files uploaded', async ({ page }) => {
    await page.goto('/analyze')

    await expect(page.locator('[data-testid="no-documents-callout"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-documents-callout"]')).toContainText(
      /simulação rápida/i,
    )
  })

  test('draft XML tip visible on upload stage', async ({ page }) => {
    await page.goto('/analyze')

    await expect(page.getByText(/rascunho/i)).toBeVisible()
  })
})
