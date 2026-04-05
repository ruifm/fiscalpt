import { test, expect, type Page } from '@playwright/test'
import path from 'path'

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/e2e')

// Minimal AT deductions page text that the parser accepts
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

// Dismiss the onboarding overlay by setting localStorage before page load
async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fiscalpt:onboarding-seen', '1')
  })
}

// Helper: upload a single XML file via the hidden file input
async function uploadXml(page: Page, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename)

  // Click the dropzone to trigger the file input
  const dropzone = page.locator('[data-testid="upload-dropzone"]')
  await expect(dropzone).toBeVisible()

  const fileChooserPromise = page.waitForEvent('filechooser')
  await dropzone.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePath)
}

// Helper: fill deduction paste areas for all visible taxpayer slots
async function fillDeductionSlots(page: Page, nifs: string[], year: number) {
  for (const nif of nifs) {
    const textarea = page.locator(`[data-testid="deduction-textarea-${nif}-${year}"]`)
    // Textarea may be inside a collapsed accordion — wait for it
    if (!(await textarea.isVisible({ timeout: 2000 }).catch(() => false))) continue
    await textarea.fill(mockDeductionsText(nif, year))
    // Wait for the onChange handler to process (triggers at > 100 chars)
    await page.waitForTimeout(300)
  }
}

// Helper: wait for step to be active
async function waitForStep(page: Page, step: 'upload' | 'questionnaire' | 'results') {
  await expect(page.locator(`[data-testid="step-${step}"]`)).toBeVisible({ timeout: 15_000 })
}

// Helper: click advance/continue button
async function clickAdvance(page: Page) {
  const btn = page.locator('[data-testid="advance-button"]')
  await expect(btn).toBeVisible()
  await expect(btn).toBeEnabled()
  await btn.click()
}

// Helper: fill questionnaire fields with reasonable defaults and proceed
async function completeQuestionnaire(page: Page) {
  const questionnaire = page.locator('[data-testid="step-questionnaire"]')
  const results = page.locator('[data-testid="step-results"]')
  await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })

  if (await questionnaire.isVisible()) {
    // Wait for the dynamically loaded questionnaire content to render
    await expect(questionnaire.locator('input, select').first()).toBeVisible({ timeout: 10_000 })

    // Fill all year spinbuttons with a reasonable default (1990)
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

    // Fill all select dropdowns with their first non-placeholder option
    const selects = questionnaire.locator('select')
    const selectCount = await selects.count()
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i)
      if (await select.isVisible()) {
        // Get available options (skip placeholder "— Selecionar —")
        const options = select.locator('option:not([value=""])')
        const optionCount = await options.count()
        if (optionCount > 0) {
          const value = await options.first().getAttribute('value')
          if (value) await select.selectOption(value)
        }
      }
    }

    // Wait for state to update
    await page.waitForTimeout(500)

    // Now click continue (should be enabled after filling fields)
    const continueBtn = page.locator('[data-testid="questionnaire-continue"]')
    await expect(continueBtn).toBeEnabled({ timeout: 5000 })
    await continueBtn.click()
  }
}

test.describe('Upload → Results flow', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page)
    await page.goto('/analyze')
    await waitForStep(page, 'upload')
  })

  test('single year married couple — full flow with 2024 declarations', async ({ page }) => {
    // Upload both holders' 2024 XMLs one at a time
    await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')

    // Wait for documents to be processed
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Fill mandatory deduction paste areas
    await fillDeductionSlots(page, ['100000001', '100000002'], 2024)

    // Click advance
    await clickAdvance(page)

    // Skip questionnaire if needed
    await completeQuestionnaire(page)

    // Should be on results now
    await waitForStep(page, 'results')

    // Verify results content
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 30_000 })

    // Should show year 2024
    await expect(page.getByText('2024')).toBeVisible()

    // Should show scenario comparison (joint vs separate)
    const resultsContainer = page.locator('[data-testid="results-container"]')
    await expect(resultsContainer).toContainText(/€/)
  })

  test('multi-year upload — 2024 declarations + 2023 previous year', async ({ page }) => {
    // Upload 2024 (primary year — declaration section)
    await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Expand the "Previous Years" section
    const prevYearsToggle = page.locator('button', {
      hasText: /anos anteriores|previous.*years/i,
    })
    await prevYearsToggle.click()

    // Upload 2023 files through the previous years dropzone (multiple enabled)
    const prevDropzone = page.locator('[data-testid="upload-dropzone"]').last()
    await expect(prevDropzone).toBeVisible({ timeout: 5000 })
    const fileChooserPromise = page.waitForEvent('filechooser')
    await prevDropzone.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles([
      path.join(FIXTURES_DIR, 'decl-m3-irs-2023-holder-a.xml'),
      path.join(FIXTURES_DIR, 'decl-m3-irs-2023-holder-b.xml'),
    ])

    // Wait for all 4 documents
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(4, { timeout: 10_000 })

    // Fill mandatory deduction paste areas for both years
    await fillDeductionSlots(page, ['100000001', '100000002'], 2024)
    await fillDeductionSlots(page, ['100000001', '100000002'], 2023)

    // Advance through flow
    await clickAdvance(page)

    // Complete questionnaire
    await completeQuestionnaire(page)

    await waitForStep(page, 'results')
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 30_000 })

    // Should show both years in the results
    const results = page.locator('[data-testid="results-container"]')
    await expect(results).toContainText('2024')
    await expect(results).toContainText('2023')
  })

  test('single holder upload — only holder A 2024', async ({ page }) => {
    await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(1, { timeout: 10_000 })

    // Try to advance — should show validation error about missing spouse
    await clickAdvance(page)

    // Should show validation error since the XML declares a spouse NIF
    await expect(page.locator('[data-testid="upload-validation-error"]')).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOnboarding(page)
    await page.goto('/analyze')
    await waitForStep(page, 'upload')
  })

  test('navigate back from questionnaire to upload', async ({ page }) => {
    await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Fill mandatory deduction paste areas
    await fillDeductionSlots(page, ['100000001', '100000002'], 2024)

    await clickAdvance(page)

    const questionnaire = page.locator('[data-testid="step-questionnaire"]')
    await expect(questionnaire).toBeVisible({ timeout: 15_000 })

    // Click back
    const backBtn = page.locator('[data-testid="questionnaire-back"]')
    await backBtn.click()

    // Should be back on upload step
    await waitForStep(page, 'upload')

    // After going back, the upload step shows the "documents loaded" summary
    // (households are preserved), with a "Continuar" button to re-advance
    await expect(page.getByText(/documentos carregados/i)).toBeVisible()
    await expect(page.locator('[data-testid="continue-to-questionnaire"]')).toBeVisible()
  })

  test('landing page CTA navigates to analyze', async ({ page }) => {
    await page.goto('/')
    const cta = page.locator('a[href="/analyze"]').first()
    await expect(cta).toBeVisible()
    await cta.click()
    await expect(page).toHaveURL(/\/analyze/)
  })
})
