import { test, expect } from '@playwright/test'
import { uploadXml, waitForStep, clickAdvance, fillDeductionSlots } from './helpers'

test.describe('Onboarding overlay', () => {
  test('appears on first visit and persists dismissal', async ({ page }) => {
    // Do NOT dismiss via localStorage — let it appear naturally
    await page.goto('/analyze')

    // Overlay should be visible on first visit
    const overlay = page.locator('[role="dialog"]')
    await expect(overlay).toBeVisible({ timeout: 10_000 })

    // Should have a dismiss/close mechanism
    const closeBtn = overlay.locator('button').last()
    await expect(closeBtn).toBeVisible()

    // Step through or close the overlay
    // The overlay has 3 steps — click through all of them
    const nextBtn = overlay.locator('button', { hasText: /próximo|next|seguinte/i })
    if (await nextBtn.isVisible()) {
      await nextBtn.click()
      await page.waitForTimeout(300)
      if (await nextBtn.isVisible()) {
        await nextBtn.click()
        await page.waitForTimeout(300)
      }
    }

    // Final step — close/dismiss
    const finishBtn = overlay.locator('button', { hasText: /começar|start|fechar|close|ok/i })
    if (await finishBtn.isVisible()) {
      await finishBtn.click()
    } else {
      await closeBtn.click()
    }

    // Overlay should be gone
    await expect(overlay).not.toBeVisible({ timeout: 5_000 })

    // Reload — overlay should NOT reappear (localStorage persists)
    await page.reload()
    await page.waitForTimeout(2_000)
    await expect(overlay).not.toBeVisible()
  })

  test('can be dismissed with Escape key', async ({ page }) => {
    await page.goto('/analyze')

    const overlay = page.locator('[role="dialog"]')
    await expect(overlay).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')
    await expect(overlay).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Session persistence', () => {
  test('household data persists across page reload', async ({ page }) => {
    // Dismiss onboarding first
    await page.addInitScript(() => {
      localStorage.setItem('fiscalpt:onboarding-seen', '1')
    })
    await page.goto('/analyze')
    await waitForStep(page, 'upload')

    await uploadXml(page, 'decl-m3-irs-2025-single-cat-a.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(1, { timeout: 10_000 })

    await fillDeductionSlots(page, ['200000001'], 2025)
    await clickAdvance(page)

    // Wait for questionnaire or results to confirm data was extracted
    const questionnaire = page.locator('[data-testid="step-questionnaire"]')
    const results = page.locator('[data-testid="step-results"]')
    await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })

    // Reload the page
    await page.reload()
    await page.waitForTimeout(2_000)

    // Session restore should bring us back (not back to empty upload step)
    await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })
  })

  test('analysis step survives page reload', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fiscalpt:onboarding-seen', '1')
    })
    await page.goto('/analyze')
    await waitForStep(page, 'upload')

    await uploadXml(page, 'decl-m3-irs-2025-single-cat-a.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(1, { timeout: 10_000 })

    await fillDeductionSlots(page, ['200000001'], 2025)
    await clickAdvance(page)

    // Should be on questionnaire or results
    const questionnaire = page.locator('[data-testid="step-questionnaire"]')
    const results = page.locator('[data-testid="step-results"]')
    await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })

    const wasOnResults = await results.isVisible()

    // Reload
    await page.reload()
    await page.waitForTimeout(2_000)

    // Should restore to the same step (or questionnaire at minimum)
    if (wasOnResults) {
      await expect(results).toBeVisible({ timeout: 15_000 })
    } else {
      await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })
    }
  })
})
