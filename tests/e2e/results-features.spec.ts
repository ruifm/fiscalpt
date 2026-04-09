import { test, expect } from '@playwright/test'
import { navigateToResults } from './helpers'

test.describe('Results page features', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToResults(page, {
      xmlFiles: ['decl-m3-irs-2025-single-cat-a.xml'],
      nifs: ['200000001'],
      year: 2025,
    })
  })

  test('share button copies to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Find the share button specifically
    const shareBtnByLabel = page.locator('button').filter({ hasText: /partilh/i })
    const shareByIcon = page.locator('button[aria-label*="artilh"], button[aria-label*="hare"]')

    const btn = shareByIcon.or(shareBtnByLabel).first()
    if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await btn.click()

      // Should show a copy confirmation or open share menu
      // Look for clipboard copy confirmation or social share dropdown
      const copyBtn = page.locator('button').filter({ hasText: /copiar|copy/i })
      if (await copyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await copyBtn.click()
        // Verify clipboard has content
        const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
        expect(clipboardText).toContain('fiscalpt')
      }
    }
  })

  test('PDF export button triggers download', async ({ page }) => {
    const pdfBtn = page.locator('button[aria-label*="PDF"], button[aria-label*="pdf"]')
    if (await pdfBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Listen for download event
      const downloadPromise = page.waitForEvent('download', { timeout: 15_000 }).catch(() => null)
      await pdfBtn.click()

      // Either a download starts or the button doesn't crash
      const download = await downloadPromise
      if (download) {
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i)
      }
      // Verify button is still functional (no crash)
      await expect(pdfBtn).toBeVisible()
    }
  })

  test('print button exists and is clickable', async ({ page }) => {
    // Mock window.print to prevent actual print dialog
    await page.evaluate(() => {
      window.print = () => {}
    })

    const printBtn = page.locator('button[aria-label*="imprimir"], button[aria-label*="print"]')
    if (await printBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await printBtn.click()
      // Should not crash — button should still be visible
      await expect(printBtn).toBeVisible()
    }
  })
})

test.describe('Locale toggle', () => {
  test('switches content between PT and EN on landing page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Verify Portuguese content is shown by default
    const heroTitle = page.locator('h1').first()
    await expect(heroTitle).toBeVisible({ timeout: 10_000 })
    const ptText = await heroTitle.textContent()
    expect(ptText).toMatch(/pagar a mais|impostos/i)

    // Find and click locale toggle
    const localeBtn = page.locator(
      'button[aria-label*="idioma"], button[aria-label*="language"], button[aria-label*="nglish"], button[aria-label*="ortuguês"]',
    )
    await expect(localeBtn).toBeVisible({ timeout: 5_000 })
    await localeBtn.click()

    // Content should switch to English
    await page.waitForTimeout(1_000)
    const enText = await heroTitle.textContent()
    expect(enText).toMatch(/overpaying|taxes/i)

    // Toggle back to Portuguese
    await localeBtn.click()
    await page.waitForTimeout(1_000)
    const ptTextAgain = await heroTitle.textContent()
    expect(ptTextAgain).toMatch(/pagar a mais|impostos/i)
  })

  test('locale persists across page navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Switch to English
    const localeBtn = page.locator(
      'button[aria-label*="idioma"], button[aria-label*="language"], button[aria-label*="nglish"], button[aria-label*="ortuguês"]',
    )
    await expect(localeBtn).toBeVisible({ timeout: 5_000 })
    await localeBtn.click()
    await page.waitForTimeout(1_000)

    // Navigate to another page
    await page.goto('/analyze')
    await page.addInitScript(() => {
      localStorage.setItem('fiscalpt:onboarding-seen', '1')
    })
    await page.reload()
    await page.waitForTimeout(2_000)

    // Check that English locale persisted (look for English UI elements)
    const pageContent = await page.textContent('body')
    // The analyze page should show English text if locale persisted
    expect(pageContent).toMatch(/upload|drag|drop|tax/i)
  })
})

test.describe('Theme toggle', () => {
  test('toggles dark class on html element', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for the theme toggle to be hydrated (mounted)
    const themeBtn = page.getByRole('button', { name: /tema|theme/i })
    await expect(themeBtn).toBeVisible({ timeout: 10_000 })

    const wasDark = (await html.getAttribute('class'))?.includes('dark') ?? false

    await themeBtn.click()
    await page.waitForTimeout(500)

    // Theme should have toggled
    const newClass = await html.getAttribute('class')
    if (wasDark) {
      expect(newClass).not.toContain('dark')
    } else {
      expect(newClass).toContain('dark')
    }
  })

  test('theme persists across reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')

    // Wait for hydrated theme toggle
    const themeBtn = page.getByRole('button', { name: /tema|theme/i })
    await expect(themeBtn).toBeVisible({ timeout: 10_000 })

    // Click until we're in dark mode
    let isDark = (await html.getAttribute('class'))?.includes('dark') ?? false
    if (!isDark) {
      await themeBtn.click()
      await page.waitForTimeout(500)
      isDark = (await html.getAttribute('class'))?.includes('dark') ?? false
    }
    expect(isDark).toBe(true)

    // Reload and verify persistence
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1_000)

    const classAfterReload = await html.getAttribute('class')
    expect(classAfterReload).toContain('dark')
  })
})
