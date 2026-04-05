/**
 * Capture screenshots of the FiscalPT results page for use on the landing page.
 *
 * Usage: npx playwright test scripts/capture-screenshots.ts
 *
 * Produces:
 *   public/screenshots/results-hero.png    — full results header with savings
 *   public/screenshots/results-scenarios.png — scenario comparison cards
 */
import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/e2e')
const OUTPUT_DIR = path.resolve(__dirname, '../../public/screenshots')

function mockDeductionsText(nif: string, year: number): string {
  return [
    `NIF: ${nif}`,
    `Ano ${year}`,
    `Boa noite, SUJEITO TESTE`,
    `Despesas Gerais Familiares`,
    `Total de despesas comunicadas 2500,00 €`,
    `Dedução calculada 250,00 €`,
    `Saúde e Seguros de Saúde`,
    `Total de despesas comunicadas 1200,00 €`,
    `Dedução calculada 180,00 €`,
    `Educação e Formação`,
    `Total de despesas comunicadas 800,00 €`,
    `Dedução calculada 240,00 €`,
    `Encargos com Imóveis`,
    `Total de despesas comunicadas 3600,00 €`,
    `Dedução calculada 502,00 €`,
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

async function waitForStep(page: Page, step: string) {
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

test('capture results page screenshots', async ({ page }) => {
  // Ensure output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Set a clean viewport
  await page.setViewportSize({ width: 1280, height: 900 })

  await dismissOnboarding(page)
  await page.goto('/analyze')
  await waitForStep(page, 'upload')

  // Upload married couple declarations
  await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
  await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')
  await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

  // Fill deductions
  await fillDeductionSlots(page, ['100000001', '100000002'], 2024)

  // Advance to questionnaire and complete it
  await clickAdvance(page)
  await completeQuestionnaire(page)

  // Wait for results
  await waitForStep(page, 'results')
  const resultsContainer = page.locator('[data-testid="results-container"]')
  await expect(resultsContainer).toBeVisible({ timeout: 30_000 })

  // Wait for animations to settle
  await page.waitForTimeout(2000)

  // Replace test names with realistic Portuguese names for marketing screenshots
  await page.evaluate(() => {
    const replacements: [string, string][] = [
      ['SUJEITO A TESTE', 'ANA SILVA'],
      ['SUJEITO B TESTE', 'PEDRO SILVA'],
    ]
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    for (const node of nodes) {
      let text = node.textContent ?? ''
      for (const [from, to] of replacements) {
        text = text.replaceAll(from, to)
      }
      node.textContent = text
    }
  })
  await page.waitForTimeout(300)

  // Screenshot 1: Full results component
  const heroSection = resultsContainer
  await heroSection.screenshot({
    path: path.join(OUTPUT_DIR, 'results-hero.png'),
    type: 'png',
  })

  // Screenshot 2: Just the scenario summary cards (current situation)
  const firstScenario = resultsContainer.locator('.rounded-xl.border').first()
  if (await firstScenario.isVisible()) {
    // Capture current situation + optimized scenario section
    const scenarioSection = resultsContainer.locator('.space-y-6').first()
    await scenarioSection.screenshot({
      path: path.join(OUTPUT_DIR, 'results-scenarios.png'),
      type: 'png',
    })
  }

  // Screenshot 3: Viewport-clipped hero for landing page (clean, no nav/stepper)
  await page.evaluate(() => {
    // Hide nav and stepper for a cleaner marketing screenshot
    const nav = document.querySelector('header')
    const stepper = document.querySelector('[aria-label="Progresso"]')
    if (nav) (nav as HTMLElement).style.display = 'none'
    if (stepper) (stepper as HTMLElement).style.display = 'none'
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(OUTPUT_DIR, 'results-full.png'),
    type: 'png',
    fullPage: false,
  })
})
