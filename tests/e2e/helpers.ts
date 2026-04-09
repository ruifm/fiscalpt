import { expect, type Page } from '@playwright/test'
import path from 'path'

export const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/e2e')

/** Minimal AT deductions page text that the parser accepts */
export function mockDeductionsText(nif: string, year: number): string {
  return [
    `NIF: ${nif}`,
    `Ano ${year}`,
    `Bom dia, SUJEITO TESTE`,
    `Despesas gerais familiares`,
    `500,00 €`,
    `Dedução correspondente à despesa 175,00 €`,
    `Saúde e seguros de saúde`,
    `200,00 €`,
    `Dedução correspondente à despesa 30,00 €`,
  ].join('\n')
}

/** Dismiss the onboarding overlay by setting localStorage before page load */
export async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('fiscalpt:onboarding-seen', '1')
  })
}

/** Upload a single XML file via the hidden file input */
export async function uploadXml(page: Page, filename: string) {
  const filePath = path.join(FIXTURES_DIR, filename)
  const dropzone = page.locator('[data-testid="upload-dropzone"]')
  await expect(dropzone).toBeVisible()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await dropzone.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePath)
}

/** Upload multiple XML files at once via the file input */
export async function uploadMultipleXml(page: Page, filenames: string[]) {
  const filePaths = filenames.map((f) => path.join(FIXTURES_DIR, f))
  const dropzone = page.locator('[data-testid="upload-dropzone"]')
  await expect(dropzone).toBeVisible()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await dropzone.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePaths)
}

/** Expand the outer "Despesas para Deduções" section if collapsed */
export async function expandDeductionSection(page: Page) {
  const btn = page.locator('[data-testid="deduction-section-toggle"]')
  try {
    await btn.waitFor({ state: 'visible', timeout: 5_000 })
    const expanded = await btn.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await btn.click()
      // Wait for the conditional content to render
      await page.waitForTimeout(800)
    }
  } catch {
    // Not present (no deduction slots)
  }
}

/** Fill deduction paste areas for all visible taxpayer slots */
export async function fillDeductionSlots(page: Page, nifs: string[], year: number) {
  await expandDeductionSection(page)
  for (const nif of nifs) {
    const textarea = page.locator(`[data-testid="deduction-textarea-${nif}-${year}"]`)
    // Wait for the deduction accordion to render after XML processing
    try {
      await textarea.waitFor({ state: 'visible', timeout: 10_000 })
    } catch {
      // Textarea not found (e.g., has liquidação — deductions optional)
      continue
    }
    await textarea.fill(mockDeductionsText(nif, year))
    // Wait for the onChange handler to process (textarea disappears on success)
    await page.waitForTimeout(500)
  }
}

/** Wait for step to be active */
export async function waitForStep(page: Page, step: 'upload' | 'questionnaire' | 'results') {
  await expect(page.locator(`[data-testid="step-${step}"]`)).toBeVisible({ timeout: 15_000 })
}

/** Click advance/continue button */
export async function clickAdvance(page: Page) {
  const btn = page.locator('[data-testid="advance-button"]')
  await expect(btn).toBeVisible()
  await expect(btn).toBeEnabled()
  await btn.click()
}

/** Fill questionnaire fields with reasonable defaults and proceed */
export async function completeQuestionnaire(page: Page) {
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

/** Upload files via the "Previous Years" section dropzone */
export async function uploadPreviousYearXml(page: Page, filenames: string[]) {
  const prevYearsToggle = page.locator('button', {
    hasText: /anos anteriores|previous.*years/i,
  })
  await prevYearsToggle.click()

  const prevDropzone = page.locator('[data-testid="upload-dropzone"]').last()
  await expect(prevDropzone).toBeVisible({ timeout: 5000 })
  const fileChooserPromise = page.waitForEvent('filechooser')
  await prevDropzone.click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filenames.map((f) => path.join(FIXTURES_DIR, f)))
}

/**
 * Complete the full upload → questionnaire → results flow.
 * Returns with the page on the results step.
 */
export async function navigateToResults(
  page: Page,
  options: {
    xmlFiles: string[]
    nifs: string[]
    year: number
    previousXml?: string[]
    previousYear?: number
  },
) {
  await dismissOnboarding(page)
  await page.goto('/analyze')
  await waitForStep(page, 'upload')

  for (const xml of options.xmlFiles) {
    await uploadXml(page, xml)
  }

  const primaryCount = options.xmlFiles.length
  await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(primaryCount, {
    timeout: 10_000,
  })

  // Upload previous year files if provided
  if (options.previousXml?.length) {
    await uploadPreviousYearXml(page, options.previousXml)
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(
      primaryCount + options.previousXml.length,
      { timeout: 10_000 },
    )
  }

  await fillDeductionSlots(page, options.nifs, options.year)
  if (options.previousXml?.length && options.previousYear) {
    await fillDeductionSlots(page, options.nifs, options.previousYear)
  }
  await clickAdvance(page)
  await completeQuestionnaire(page)

  await waitForStep(page, 'results')
  await expect(page.locator('[data-testid="results-container"]')).toBeVisible({ timeout: 30_000 })
}
