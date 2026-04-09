import { test, expect } from '@playwright/test'
import path from 'path'
import {
  FIXTURES_DIR,
  dismissOnboarding,
  uploadXml,
  fillDeductionSlots,
  waitForStep,
  clickAdvance,
  completeQuestionnaire,
} from './helpers'

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
    const resultsContainer = page.locator('[data-testid="results-container"]')
    await expect(resultsContainer).toBeVisible({ timeout: 30_000 })

    // Should show year 2024
    await expect(resultsContainer.getByText('2024')).toBeVisible()

    // Should show scenario comparison (joint vs separate)
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

    // Advance — spouse-missing is now a warning (not blocking error)
    await clickAdvance(page)

    // Should proceed to questionnaire despite missing spouse declaration
    await waitForStep(page, 'questionnaire')
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

    // After going back, the upload step shows the full upload component
    // with previously uploaded documents and navigation buttons
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })
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
