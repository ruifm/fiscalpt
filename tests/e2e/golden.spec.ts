/**
 * Golden / canary E2E regression tests.
 *
 * Upload anonymized+fuzzed real AT documents through the full UI flow,
 * fill deductions with known amounts, answer questionnaire with golden
 * enrichment values, then assert specific numeric results from the tax engine.
 *
 * If these tests fail after an engine change, verify the new values are correct
 * (cross-check with AT liquidacao or manual calculation), then update the golden
 * constants below.
 *
 * Fixture provenance: anonymized (NIF scramble) + fuzzed (x0.87/x1.23) from
 * real AT Modelo 3 declarations for tax years 2021-2025.
 *
 * Three variants:
 *   1. All years (2021-2025): 10 XMLs, 6 year tabs (inc. projected 2026)
 *   2. 2025 only: 2 XMLs, 2 year tabs (2025 + projected 2026)
 *   3. 2024 primary with liquidacao: 2 XMLs + PDF, 1 year result (no tabs)
 */
import { test, expect, type Page } from '@playwright/test'
import path from 'path'
import { dismissOnboarding, uploadXml, waitForStep, clickAdvance, FIXTURES_DIR } from './helpers'

// -- Constants ---------------------------------------------------------------

const NIFS = ['100000001', '100000002'] as const

// -- Golden expected values --------------------------------------------------

interface GoldenHolder {
  irs: string
  rate: string
}

interface GoldenScenario {
  gross: string
  irs: string
  rate: string
  refundOrPay: string
  holderA?: GoldenHolder
  holderB?: GoldenHolder
}

interface GoldenYear {
  year: number
  amendable: boolean
  projected?: boolean
  current: GoldenScenario
  optimized?: GoldenScenario
  savings?: string
}

// Golden values computed with PhD=false (E2E default Switch state).
// Unit tests (golden-pipeline.test.ts) use PhD=true — different values for pre-2025.
// Non-PhD golden values: irs_jovem_is_phd=false (default Switch off)
// Member 0 (birth 1994): age 27-30 in 2021-2024 > maxAge=26 → no pre-2025 IRS Jovem
// Post-2025: first_work_year=2021, maxAge=35, age 31-32 ≤ 35 → IRS Jovem applies
// Dependents: born 2019 + 2022 (matching E2E questionnaire answers)
const ALL_YEARS_GOLDEN: GoldenYear[] = [
  {
    year: 2021,
    amendable: false,
    current: {
      gross: '41 507,33',
      irs: '7085,83',
      rate: '17,1%',
      refundOrPay: '1565,15',
      holderA: { irs: '1586,44', rate: '11,3%' },
      holderB: { irs: '5499,39', rate: '20,0%' },
    },
  },
  {
    year: 2022,
    amendable: false,
    current: {
      gross: '44 826,12',
      irs: '8820,90',
      rate: '19,7%',
      refundOrPay: '1199,67',
      holderA: { irs: '5599,35', rate: '19,5%' },
      holderB: { irs: '3221,55', rate: '20,0%' },
    },
  },
  {
    year: 2023,
    amendable: true,
    current: {
      gross: '111 281,17',
      irs: '23 207,11',
      rate: '20,8%',
      refundOrPay: '8227,45',
      holderA: { irs: '12 538,40', rate: '21,6%' },
      holderB: { irs: '10 668,71', rate: '20,0%' },
    },
    savings: '3932,91',
    optimized: {
      gross: '111 281,17',
      irs: '19 274,20',
      rate: '17,3%',
      refundOrPay: '4294,54',
      holderA: { irs: '8605,49', rate: '14,9%' },
      holderB: { irs: '10 668,71', rate: '20,0%' },
    },
  },
  {
    year: 2024,
    amendable: true,
    current: {
      gross: '76 615,12',
      irs: '14 106,72',
      rate: '18,4%',
      refundOrPay: '9180,57',
      holderA: { irs: '9249,54', rate: '17,7%' },
      holderB: { irs: '4857,18', rate: '20,0%' },
    },
    savings: '4365,36',
    optimized: {
      gross: '76 615,12',
      irs: '9741,36',
      rate: '12,7%',
      refundOrPay: '4815,21',
      holderA: { irs: '4884,18', rate: '9,3%' },
      holderB: { irs: '4857,18', rate: '20,0%' },
    },
  },
  {
    year: 2025,
    amendable: true,
    current: {
      gross: '128 196,93',
      irs: '15 050,29',
      rate: '11,7%',
      refundOrPay: '3880,67',
      holderA: { irs: '2828,84', rate: '4,2%' },
      holderB: { irs: '12 221,45', rate: '20,0%' },
    },
    savings: '2159,83',
    optimized: {
      gross: '128 196,93',
      irs: '12 890,46',
      rate: '10,1%',
      refundOrPay: '6040,50',
      holderA: { irs: '669,01', rate: '1,0%' },
      holderB: { irs: '12 221,45', rate: '20,0%' },
    },
  },
  {
    year: 2026,
    amendable: true,
    projected: true,
    current: {
      gross: '128 196,93',
      irs: '15 113,29',
      rate: '11,8%',
      refundOrPay: '13 869,34',
      holderA: { irs: '2891,84', rate: '4,3%' },
      holderB: { irs: '12 221,45', rate: '20,0%' },
    },
    savings: '2096,83',
    optimized: {
      gross: '128 196,93',
      irs: '13 016,46',
      rate: '10,2%',
      refundOrPay: '15 966,17',
      holderA: { irs: '795,01', rate: '1,2%' },
      holderB: { irs: '12 221,45', rate: '20,0%' },
    },
  },
]

const YEAR_2025_ONLY_GOLDEN: GoldenYear[] = [
  ALL_YEARS_GOLDEN.find((g) => g.year === 2025)!,
  ALL_YEARS_GOLDEN.find((g) => g.year === 2026)!,
]

const YEAR_2024_PRIMARY_GOLDEN: GoldenYear[] = [
  {
    year: 2024,
    amendable: true,
    current: {
      gross: '76 615,12',
      irs: '10 388,06',
      rate: '13,6%',
      refundOrPay: '5461,91',
      holderA: { irs: '5530,88', rate: '10,6%' },
      holderB: { irs: '4857,18', rate: '20,0%' },
    },
    savings: '3292,86',
    optimized: {
      gross: '76 615,12',
      irs: '7095,20',
      rate: '9,3%',
      refundOrPay: '2169,05',
      holderA: { irs: '2238,02', rate: '4,3%' },
      holderB: { irs: '4857,18', rate: '20,0%' },
    },
  },
]

// -- Helpers -----------------------------------------------------------------

function goldenDeductionsText(nif: string, year: number): string {
  return [
    'NIF: ' + nif,
    'Ano ' + year,
    'Bom dia, SUJEITO TESTE',
    'Despesas gerais familiares',
    '250,00 \u20ac',
    'Dedu\u00e7\u00e3o correspondente \u00e0 despesa 87,50 \u20ac',
    'Sa\u00fade e seguros de sa\u00fade',
    '350,00 \u20ac',
    'Dedu\u00e7\u00e3o correspondente \u00e0 despesa 52,50 \u20ac',
    'Educa\u00e7\u00e3o e forma\u00e7\u00e3o',
    '200,00 \u20ac',
    'Dedu\u00e7\u00e3o correspondente \u00e0 despesa 60,00 \u20ac',
    'Encargos com im\u00f3veis',
    '400,00 \u20ac',
    'Dedu\u00e7\u00e3o correspondente \u00e0 despesa 60,00 \u20ac',
  ].join('\n')
}

async function expandCollapsedAncestor(page: Page, testId: string) {
  const el = page.locator('[data-testid="' + testId + '"]')
  if (await el.isVisible()) return

  // Level 1: expand the outer "Despesas para Deduções" card via testid
  const outerToggle = page.locator('[data-testid="deduction-section-toggle"]')
  try {
    await outerToggle.waitFor({ state: 'visible', timeout: 5_000 })
    const expanded = await outerToggle.getAttribute('aria-expanded')
    if (expanded !== 'true') {
      await outerToggle.click()
      await page.waitForTimeout(800)
    }
  } catch {
    // Not present
  }

  if (await el.isVisible()) return

  // Level 2+3: expand inner accordion buttons (Contribuintes, NIF group)
  const nif = testId.match(/deduction-slot-(\d+)-/)?.[1]
  const patterns = [/contribuintes|taxpayers/i, ...(nif ? [new RegExp('NIF\\s*' + nif)] : [])]

  for (const pattern of patterns) {
    if (await el.isVisible()) return
    const btns = page.locator('button[aria-expanded="false"]')
    const count = await btns.count()
    for (let i = 0; i < count; i++) {
      const btn = btns.nth(i)
      const text = await btn.textContent()
      if (text && pattern.test(text)) {
        await btn.click()
        await page.waitForTimeout(800)
        break
      }
    }
  }
}

async function fillGoldenSlot(page: Page, nif: string, year: number) {
  const slotTestId = 'deduction-slot-' + nif + '-' + year
  await expandCollapsedAncestor(page, slotTestId)

  const slot = page.locator('[data-testid="' + slotTestId + '"]')
  await expect(slot, 'Deduction slot ' + nif + '/' + year + ' should exist').toBeVisible({
    timeout: 5_000,
  })

  const textarea = page.locator('[data-testid="deduction-textarea-' + nif + '-' + year + '"]')
  await expect(textarea, 'Textarea ' + nif + '/' + year + ' should be visible').toBeVisible({
    timeout: 5_000,
  })
  await textarea.fill(goldenDeductionsText(nif, year))
  await page.waitForTimeout(500)

  // Verify parse succeeded (green CheckCircle SVG appears)
  await expect(
    slot.locator('svg.text-green-600'),
    'Deduction slot ' + nif + '/' + year + ' should parse successfully',
  ).toBeVisible({ timeout: 5_000 })
}

async function fillGoldenDeductionSlots(page: Page, years: readonly number[]) {
  for (const year of years) {
    for (const nif of NIFS) {
      await fillGoldenSlot(page, nif, year)
    }
  }
}

async function uploadPreviousYearXmls(page: Page, filenames: string[]) {
  const toggle = page.locator('button', { hasText: /anos anteriores|previous.*years/i })
  await toggle.click()
  const dropzone = page.locator('[data-testid="upload-dropzone"]').last()
  await expect(dropzone).toBeVisible({ timeout: 5_000 })
  const fc = page.waitForEvent('filechooser')
  await dropzone.click()
  const chooser = await fc
  await chooser.setFiles(filenames.map((f) => path.join(FIXTURES_DIR, f)))
}

/**
 * Strict multi-pass questionnaire filler.
 * Fills ONLY specified question IDs. Fails if any visible number input
 * remains unfilled after all known answers are applied.
 */
async function fillStrictQuestionnaire(
  page: Page,
  textAnswers: Record<string, string>,
  selectAnswers: Record<string, string> = {},
  booleanAnswers: Record<string, boolean> = {},
) {
  const questionnaire = page.locator('[data-testid="step-questionnaire"]')
  const results = page.locator('[data-testid="step-results"]')
  await expect(questionnaire.or(results)).toBeVisible({ timeout: 15_000 })
  if (await results.isVisible()) return

  await expect(questionnaire.locator('input, select').first()).toBeVisible({ timeout: 10_000 })

  // Phase 1a: Member birth years first (triggers IRS Jovem / NHR question recomputation)
  const memberBirthKeys = Object.keys(textAnswers).filter(
    (k) => k.includes('birth_year') && k.startsWith('member.'),
  )
  for (const qid of memberBirthKeys) {
    const input = page.locator('#q-' + qid.replace(/\./g, '-'))
    await expect(input, 'Birth year field ' + qid).toBeVisible({ timeout: 5_000 })
    await input.fill(textAnswers[qid])
  }

  // Wait for React to recompute after member birth years
  await page.waitForTimeout(1_500)

  // Phase 1b: Dependent birth years (must wait for member-triggered re-render to settle)
  const depBirthKeys = Object.keys(textAnswers).filter(
    (k) => k.includes('birth_year') && k.startsWith('dependent.'),
  )
  for (const qid of depBirthKeys) {
    const input = page.locator('#q-' + qid.replace(/\./g, '-'))
    await expect(input, 'Birth year field ' + qid).toBeVisible({ timeout: 5_000 })
    await input.fill(textAnswers[qid])
  }

  // Wait for React to recompute dynamic questions
  await page.waitForTimeout(1_000)

  // Phase 2: Remaining text inputs (IRS Jovem, NHR, degree_year)
  const otherTextKeys = Object.keys(textAnswers).filter((k) => !k.includes('birth_year'))
  for (const qid of otherTextKeys) {
    const input = page.locator('#q-' + qid.replace(/\./g, '-'))
    await expect(input, 'Text field ' + qid).toBeVisible({ timeout: 5_000 })
    await input.fill(textAnswers[qid])
  }

  // Phase 3: Selects (if any remain)
  for (const [qid, value] of Object.entries(selectAnswers)) {
    const select = questionnaire.locator('[data-question-id*="' + qid + '"] select')
    await expect(select, 'Select ' + qid).toBeVisible({ timeout: 5_000 })
    await select.selectOption(value)
  }

  // Phase 4: Boolean switches (e.g., irs_jovem_is_phd)
  for (const [qid, targetValue] of Object.entries(booleanAnswers)) {
    const switchEl = page.locator('#q-' + qid.replace(/\./g, '-'))
    await expect(switchEl, 'Boolean field ' + qid).toBeVisible({ timeout: 5_000 })
    const isChecked = await switchEl.getAttribute('aria-checked')
    const currentlyOn = isChecked === 'true'
    if (currentlyOn !== targetValue) {
      await switchEl.click()
    }
  }

  await page.waitForTimeout(500)

  // Phase 5: Assert no unfilled inputs remain
  const allInputs = questionnaire.locator('input[type="number"]')
  for (let i = 0; i < (await allInputs.count()); i++) {
    const input = allInputs.nth(i)
    if (await input.isVisible()) {
      const value = await input.inputValue()
      const id = (await input.getAttribute('id')) ?? 'unknown'
      expect(value, 'Unexpected unfilled question: ' + id).not.toBe('')
      expect(value, 'Unexpected zero-value question: ' + id).not.toBe('0')
    }
  }

  const allSelects = questionnaire.locator('select')
  for (let i = 0; i < (await allSelects.count()); i++) {
    const sel = allSelects.nth(i)
    if (await sel.isVisible()) {
      const value = await sel.inputValue()
      const id = (await sel.getAttribute('id')) ?? 'unknown'
      expect(value, 'Unexpected unfilled select: ' + id).toBeTruthy()
    }
  }

  const continueBtn = page.locator('[data-testid="questionnaire-continue"]')
  await expect(continueBtn).toBeEnabled({ timeout: 5_000 })
  await continueBtn.click()
}

/**
 * Get visible text for a specific year tab only.
 * For multi-year: clicks the tab, reads the active panel only.
 * For single year: reads the results container directly.
 *
 * innerText() excludes display:none elements, so hidden tab panels and
 * .print-all-years (class="hidden") are automatically excluded.
 * To avoid HistoricalComparison pollution, we read from the active
 * TabsContent panel rather than the full container.
 */
async function getVisibleYearText(page: Page, year: number, multiYear: boolean): Promise<string> {
  const results = page.locator('[data-testid="results-container"]')
  if (multiYear) {
    // Click the year tab (exact match to avoid "2026" matching "202")
    const tabTrigger = results
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: new RegExp('^\\s*' + year + '\\b') })
    await tabTrigger.first().click()
    await page.waitForTimeout(300)

    // Read the active (non-hidden) TabsContent panel
    const panels = results.locator('[data-slot="tabs-content"]')
    const count = await panels.count()
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i)
      const hidden = await panel.getAttribute('hidden')
      if (hidden === null) {
        return (await panel.innerText()).replace(/\u00a0/g, ' ')
      }
    }
    // Fallback
    return (await results.innerText()).replace(/\u00a0/g, ' ')
  }

  return (await results.innerText()).replace(/\u00a0/g, ' ')
}

/**
 * Assert golden values for one year. Splits text into current vs optimized
 * sections to ensure values come from the correct scenario.
 */
function assertGoldenYear(text: string, golden: GoldenYear) {
  const optimizedRe = /Cen\u00e1rio Otimizado/i
  const hasOptimized = optimizedRe.test(text)
  const [currentText, ...optimizedParts] = text.split(optimizedRe)
  const optimizedText = optimizedParts.join(' ')

  // -- Current scenario --
  const c = golden.current
  expect(currentText, golden.year + ' current: gross').toContain(c.gross)
  expect(currentText, golden.year + ' current: IRS').toContain(c.irs)
  expect(currentText, golden.year + ' current: rate').toContain(c.rate)
  expect(currentText, golden.year + ' current: refund/pay').toContain(c.refundOrPay)
  if (c.holderA) {
    expect(currentText, golden.year + ' current: holder A IRS').toContain(c.holderA.irs)
    expect(currentText, golden.year + ' current: holder A rate').toContain(c.holderA.rate)
  }
  if (c.holderB) {
    expect(currentText, golden.year + ' current: holder B IRS').toContain(c.holderB.irs)
  }

  // -- Optimized scenario --
  if (golden.optimized) {
    expect(hasOptimized, golden.year + ': should have optimized section').toBe(true)
    const o = golden.optimized
    expect(optimizedText, golden.year + ' optimized: IRS').toContain(o.irs)
    expect(optimizedText, golden.year + ' optimized: rate').toContain(o.rate)
    expect(optimizedText, golden.year + ' optimized: refund/pay').toContain(o.refundOrPay)
    if (o.holderA) {
      expect(optimizedText, golden.year + ' optimized: holder A IRS').toContain(o.holderA.irs)
      expect(optimizedText, golden.year + ' optimized: holder A rate').toContain(o.holderA.rate)
    }
  }

  // -- Savings badge --
  if (golden.savings) {
    expect(text, golden.year + ': savings').toContain(golden.savings)
  }

  // Historical years must NOT have optimized section
  if (!golden.amendable && !golden.projected) {
    expect(hasOptimized, golden.year + ': historical must not have optimized').toBe(false)
  }
}

// Amendable year boundaries: year Y is amendable until June 30 of Y+3.
// These golden values assume 2023-2025 are amendable, 2021-2022 historical.
// This holds true until 2026-06-30 when 2023 becomes historical.
// If this date has passed, re-capture golden values and update constants.
const AMENDABLE_DEADLINE_2023 = new Date('2026-06-30T23:59:59Z')

function checkAmendableBoundary() {
  if (Date.now() > AMENDABLE_DEADLINE_2023.getTime()) {
    throw new Error(
      'Golden test boundary expired: year 2023 is no longer amendable after 2026-06-30. ' +
        'Re-capture golden values with golden-capture.spec.ts and update the constants.',
    )
  }
}

// -- Tests -------------------------------------------------------------------

test.describe('Golden canary: all years (2021-2025)', () => {
  test('uploads all years, fills questionnaire, asserts golden values', async ({ page }) => {
    test.setTimeout(180_000)
    checkAmendableBoundary()

    await dismissOnboarding(page)
    await page.goto('/analyze')
    await waitForStep(page, 'upload')

    // Upload primary year (2025)
    await uploadXml(page, 'decl-m3-irs-2025-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2025-holder-b.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Upload previous years
    const prevFiles = [2021, 2022, 2023, 2024].flatMap((y) => [
      'decl-m3-irs-' + y + '-holder-a.xml',
      'decl-m3-irs-' + y + '-holder-b.xml',
    ])
    await uploadPreviousYearXmls(page, prevFiles)
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(10, { timeout: 15_000 })

    // Fill deductions for all years
    await fillGoldenDeductionSlots(page, [2021, 2022, 2023, 2024, 2025])

    await clickAdvance(page)

    // Strict questionnaire — 2 dependents (from 2024/2025 XMLs): born 2019 + 2022
    // degree_year explicit to avoid hidden dependency on XML fixture
    // irs_jovem_is_phd defaults to false (Switch off) → member 0 (birth 1994,
    // age 27-30 in 2021-2024) exceeds non-PhD maxAge=26 → no IRS Jovem pre-2025.
    // Post-2025 uses first_work_year with maxAge=35, so 2025+ IRS Jovem applies.
    // cat_b_start_year: auto-infer mutates household → question appears in
    // liveQuestions merge but not initialQuestions → input renders empty.
    // Explicitly providing the inferred value (earliest Cat B year = 2021).
    await fillStrictQuestionnaire(page, {
      'member.0.birth_year': '1994',
      'member.1.birth_year': '1989',
      'dependent.0.birth_year': '2019',
      'dependent.1.birth_year': '2022',
      'member.0.first_work_year': '2021',
      'member.0.degree_year': '2020',
      'member.0.cat_b_start_year': '2021',
      'member.1.nhr_start_year': '2021',
    })

    await waitForStep(page, 'results')
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({
      timeout: 30_000,
    })

    for (const golden of ALL_YEARS_GOLDEN) {
      const text = await getVisibleYearText(page, golden.year, true)
      assertGoldenYear(text, golden)
    }
  })
})

test.describe('Golden canary: 2025 only', () => {
  test('uploads 2025 only, asserts golden values', async ({ page }) => {
    test.setTimeout(120_000)
    checkAmendableBoundary()
    await dismissOnboarding(page)
    await page.goto('/analyze')
    await waitForStep(page, 'upload')

    await uploadXml(page, 'decl-m3-irs-2025-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2025-holder-b.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    await fillGoldenDeductionSlots(page, [2025])
    await clickAdvance(page)

    // Cat B start year asked as text input (3rd+ year → 2023)
    // 2 dependents: born 2019 + 2022
    await fillStrictQuestionnaire(page, {
      'member.0.birth_year': '1994',
      'member.1.birth_year': '1989',
      'dependent.0.birth_year': '2019',
      'dependent.1.birth_year': '2022',
      'member.0.first_work_year': '2021',
      'member.1.nhr_start_year': '2021',
      'member.0.cat_b_start_year': '2023',
    })

    await waitForStep(page, 'results')
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({
      timeout: 30_000,
    })

    // 2025-only renders 2 tabs: 2025 + projected 2026
    for (const golden of YEAR_2025_ONLY_GOLDEN) {
      const text = await getVisibleYearText(page, golden.year, true)
      assertGoldenYear(text, golden)
    }
  })
})

test.describe('Golden canary: 2024 primary with liquidacao', () => {
  test('uploads 2024 with liquidacao PDF, asserts golden values and no mismatch', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    checkAmendableBoundary()
    await dismissOnboarding(page)
    await page.goto('/analyze')

    await waitForStep(page, 'upload')

    await uploadXml(page, 'decl-m3-irs-2024-holder-a.xml')
    await uploadXml(page, 'decl-m3-irs-2024-holder-b.xml')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Expand liquidacao section and upload PDF
    const liqToggle = page.locator('button[aria-expanded]', {
      has: page.locator('text=Demonstra'),
    })
    await liqToggle.click()
    await page.waitForTimeout(500)

    const liqDropzone = page.locator('[data-testid="upload-dropzone"]').last()
    const fc = page.waitForEvent('filechooser')
    await liqDropzone.click()
    const chooser = await fc
    await chooser.setFiles(path.join(FIXTURES_DIR, 'liquidacao-2024-holder-a.pdf'))
    await page.waitForTimeout(3_000)

    await fillGoldenDeductionSlots(page, [2024])
    await clickAdvance(page)

    // 2024 asks degree_year (not first_work_year), Cat B start year = 2023
    // 2 dependents: born 2019 + 2022
    // member.1 (birth 1989, age 35 in 2024) exceeds pre-2025 maxAge 30 → no degree_year
    await fillStrictQuestionnaire(page, {
      'member.0.birth_year': '1994',
      'member.1.birth_year': '1989',
      'dependent.0.birth_year': '2019',
      'dependent.1.birth_year': '2022',
      'member.0.degree_year': '2020',
      'member.1.nhr_start_year': '2021',
      'member.0.cat_b_start_year': '2023',
    })

    await waitForStep(page, 'results')
    const container = page.locator('[data-testid="results-container"]')
    await expect(container).toBeVisible({ timeout: 30_000 })

    // Single year -- no tabs
    for (const golden of YEAR_2024_PRIMARY_GOLDEN) {
      const text = await getVisibleYearText(page, golden.year, false)
      assertGoldenYear(text, golden)
    }

    // Verify no liquidacao mismatch warnings
    const warningBlock = container.locator('[role="status"]')
    const warningCount = await warningBlock.count()
    if (warningCount > 0) {
      const warningText = await warningBlock.innerText()
      expect(warningText, 'No liquidacao mismatch warnings').not.toMatch(/liquidac|mismatch/i)
    }
  })
})

// -- PDF Comprovativo Variants -----------------------------------------------
// Same household, same fuzz factors, but input via comprovativo PDFs instead of
// XML Modelo 3. Covers 2021-2024 (no 2025 comprovativo exists).
// Primary year is 2024 → projection is 2025.

test.describe('Golden canary: all years PDF comprovativos (2021-2024)', () => {
  test('uploads comprovativo PDFs for 2021-2024, fills questionnaire, captures golden values', async ({
    page,
  }) => {
    test.setTimeout(180_000)
    checkAmendableBoundary()
    await dismissOnboarding(page)
    await page.goto('/analyze')
    await waitForStep(page, 'upload')

    // Upload primary year (2024) comprovativos
    await uploadXml(page, 'comprovativo-2024-holder-a.pdf')
    await uploadXml(page, 'comprovativo-2024-holder-b.pdf')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Upload previous years (2021-2023) comprovativos
    const prevFiles = [2021, 2022, 2023].flatMap((y) => [
      'comprovativo-' + y + '-holder-a.pdf',
      'comprovativo-' + y + '-holder-b.pdf',
    ])
    await uploadPreviousYearXmls(page, prevFiles)
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(8, { timeout: 15_000 })

    // Fill deductions for years 2021-2024
    await fillGoldenDeductionSlots(page, [2021, 2022, 2023, 2024])

    await clickAdvance(page)

    // Questionnaire — with assembly fix, both holders' data is now present.
    // PDF comprovativos extract IRS Jovem from Anexo A (so no first_work_year needed)
    // and NHR from Anexo L. member.1 (birth 1989, age 35) exceeds pre-2025 maxAge 30.
    await fillStrictQuestionnaire(page, {
      'member.0.birth_year': '1994',
      'member.1.birth_year': '1989',
      'dependent.0.birth_year': '2019',
      'dependent.1.birth_year': '2022',
      'member.0.degree_year': '2020',
      'member.1.nhr_start_year': '2021',
      'member.0.cat_b_start_year': '2023',
    })

    await waitForStep(page, 'results')
    await expect(page.locator('[data-testid="results-container"]')).toBeVisible({
      timeout: 30_000,
    })

    // Projection tab (2025) only appears if currentYear - 1 <= primaryYear,
    // i.e. only when running in 2025. Check dynamically.
    const availableYears = [2021, 2022, 2023, 2024]
    const has2025 = await page
      .locator('[data-slot="tabs-trigger"]')
      .filter({ hasText: /2025/ })
      .count()
    if (has2025 > 0) availableYears.push(2025)

    for (const year of availableYears) {
      const text = await getVisibleYearText(page, year, true)
      console.log(`=== PDF_ALL_YEARS: ${year} ===`)
      console.log(text.substring(0, 3000))
      console.log(`=== END ${year} ===`)
    }
  })
})

test.describe('Golden canary: 2024 primary PDF with liquidacao', () => {
  test('uploads 2024 comprovativo PDFs with liquidacao, asserts golden values match XML', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    checkAmendableBoundary()
    await dismissOnboarding(page)
    await page.goto('/analyze')

    await waitForStep(page, 'upload')

    // Upload 2024 comprovativos as primary
    await uploadXml(page, 'comprovativo-2024-holder-a.pdf')
    await uploadXml(page, 'comprovativo-2024-holder-b.pdf')
    await expect(page.locator('[data-testid="upload-slot"]')).toHaveCount(2, { timeout: 10_000 })

    // Expand liquidacao section and upload PDF
    const liqToggle = page.locator('button[aria-expanded]', {
      has: page.locator('text=Demonstra'),
    })
    await liqToggle.click()
    await page.waitForTimeout(500)

    const liqDropzone = page.locator('[data-testid="upload-dropzone"]').last()
    const fc = page.waitForEvent('filechooser')
    await liqDropzone.click()
    const chooser = await fc
    await chooser.setFiles(path.join(FIXTURES_DIR, 'liquidacao-2024-holder-a.pdf'))
    await page.waitForTimeout(3_000)

    // Fill deduction slots — same amounts as XML variant for parity
    await fillGoldenDeductionSlots(page, [2024])
    await clickAdvance(page)

    // Questionnaire — PDF extracts IRS Jovem from Anexo A, NHR from Anexo L
    // member.1 (birth 1989, age 35) exceeds pre-2025 maxAge 30 → no degree_year
    await fillStrictQuestionnaire(page, {
      'member.0.birth_year': '1994',
      'member.1.birth_year': '1989',
      'dependent.0.birth_year': '2019',
      'dependent.1.birth_year': '2022',
      'member.0.degree_year': '2020',
      'member.1.nhr_start_year': '2021',
      'member.0.cat_b_start_year': '2023',
    })

    await waitForStep(page, 'results')
    const container = page.locator('[data-testid="results-container"]')
    await expect(container).toBeVisible({ timeout: 30_000 })

    // Assert golden values — must match XML 2024-primary exactly
    for (const golden of YEAR_2024_PRIMARY_GOLDEN) {
      const text = await getVisibleYearText(page, golden.year, false)
      assertGoldenYear(text, golden)
    }

    // Verify no liquidacao mismatch warnings
    const warningBlock = container.locator('[role="status"]')
    const warningCount = await warningBlock.count()
    if (warningCount > 0) {
      const warningText = await warningBlock.innerText()
      expect(warningText, 'No liquidacao mismatch warnings').not.toMatch(/liquidac|mismatch/i)
    }
  })
})
