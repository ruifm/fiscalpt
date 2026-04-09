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

  test('Cat B expansion — fill freelance income', async ({ page }) => {
    await fillBirthYear(page, 'Contribuinte', '1985')
    await fillGrossCatA(page, 'Contribuinte', '20000')

    // Expand Cat B section
    await page.getByRole('button', { name: /independente/i }).click()
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

test.describe('Mode toggle — Analyze page', () => {
  test('analyze page has link to simulation', async ({ page }) => {
    await page.goto('/analyze')

    const simLink = page.locator('a[href="/simulacao"]').first()
    await expect(simLink).toBeVisible()
  })
})
