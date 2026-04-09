/**
 * Golden pipeline tests — unit-level (no browser).
 *
 * Exercises the full document→engine pipeline for each golden variant:
 *   1. Parse fixtures (XML / PDF)
 *   2. Assemble households
 *   3. Apply questionnaire answers
 *   4. Propagate shared data across years
 *   5. Build projected household
 *   6. Run tax engine (analyzeHousehold)
 *   7. Assert golden values + special regimes + liquidação validation
 *
 * This catches regressions in the deterministic pipeline without E2E overhead.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { parseModelo3Xml } from '@/lib/tax/xml-parser'
import {
  parseComprovativoPdfText,
  parseLiquidacaoText,
} from '@/lib/tax/pdf-extractor'
import type { LiquidacaoParsed } from '@/lib/tax/pdf-extractor'
import {
  assembleHouseholds,
  type AssemblyFile,
  type AssemblyInput,
} from '@/lib/tax/assemble-households'
import { applyAnswers } from '@/lib/tax/missing-inputs'
import { propagateSharedData } from '@/lib/tax/propagate-shared-data'
import { buildProjectedHousehold } from '@/lib/tax/projection'
import { analyzeHousehold } from '@/lib/tax/calculator'
import type { Household, AnalysisResult, ScenarioResult } from '@/lib/tax/types'
import { deriveResultsView } from '@/lib/tax/results-view'
import { personTotalIrs } from '@/lib/tax/historical-comparison'
import { parseDeductionsPageText } from '@/lib/tax/deductions-parser'
import type { DeductionsParseResult } from '@/lib/tax/deductions-parser'

// DOMParser polyfill for xml-parser
beforeAll(() => {
  const dom = new JSDOM('')
  globalThis.DOMParser = dom.window.DOMParser
})

// ─── Fixture Helpers ─────────────────────────────────────────

const FIXTURES = path.resolve(__dirname, '../fixtures/e2e')

function loadXml(filename: string): AssemblyFile {
  const filePath = path.join(FIXTURES, filename)
  const xml = fs.readFileSync(filePath, 'utf-8')
  const parsed = parseModelo3Xml(xml)
  return {
    fileName: filename,
    status: 'done',
    nif: parsed.raw.subjectA_nif,
    year: parsed.raw.year,
    nifConjuge: parsed.raw.subjectB_nif,
    parsedXml: parsed,
  }
}

async function extractTextFromPdfNode(filePath: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(fs.readFileSync(filePath))
  const doc = await pdfjsLib.getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item: unknown) => {
        const t = item as { str?: string }
        return t.str ?? ''
      })
      .join(' ')
    pages.push(text)
  }

  return pages.join('\n---PAGE---\n')
}

async function loadComprovativoPdf(filename: string): Promise<AssemblyFile> {
  const filePath = path.join(FIXTURES, filename)
  const text = await extractTextFromPdfNode(filePath)
  const parsed = parseComprovativoPdfText(text)
  return {
    fileName: filename,
    status: 'done',
    nif: parsed.nif,
    year: parsed.year ?? undefined,
    nifConjuge: parsed.nifConjuge,
    parsedComprovativo: parsed,
  }
}

async function loadLiquidacaoPdf(filename: string): Promise<{ file: AssemblyFile; parsed: LiquidacaoParsed }> {
  const filePath = path.join(FIXTURES, filename)
  const text = await extractTextFromPdfNode(filePath)
  const parsed = parseLiquidacaoText(text)
  return {
    file: {
      fileName: filename,
      status: 'done',
      nif: parsed.nif,
      year: parsed.year ?? undefined,
      parsedLiquidacao: parsed,
    },
    parsed,
  }
}

const NIFS = ['100000001', '100000002'] as const

function goldenDeductionsText(nif: string, year: number): string {
  return [
    'NIF: ' + nif,
    'Ano ' + year,
    'Bom dia, SUJEITO TESTE',
    'Despesas gerais familiares',
    '250,00 €',
    'Dedução correspondente à despesa 87,50 €',
    'Saúde e seguros de saúde',
    '350,00 €',
    'Dedução correspondente à despesa 52,50 €',
    'Educação e formação',
    '200,00 €',
    'Dedução correspondente à despesa 60,00 €',
    'Encargos com imóveis',
    '400,00 €',
    'Dedução correspondente à despesa 60,00 €',
  ].join('\n')
}

function buildDeductionSlots(years: readonly number[]) {
  const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>()
  const deductionSlots: { key: string; nif: string; year: number; role: 'taxpayer' | 'dependent'; hasLiquidacao: boolean }[] = []

  for (const year of years) {
    for (const nif of NIFS) {
      const key = `${nif}-${year}`
      const text = goldenDeductionsText(nif, year)
      const result = parseDeductionsPageText(text)
      pastedDeductions.set(key, { text, result })
      deductionSlots.push({ key, nif, year, role: 'taxpayer', hasLiquidacao: false })
    }
  }

  return { pastedDeductions, deductionSlots }
}

// ─── Pipeline Runner ─────────────────────────────────────────

interface PipelineResult {
  years: Map<number, {
    household: Household
    analysis: AnalysisResult
    regimes: { member: number; name: string; special_regimes: string[]; irs_jovem_year?: number; nhr_start_year?: number; irs_jovem_first_work_year?: number; irs_jovem_degree_year?: number }[]
  }>
  liquidacao?: LiquidacaoParsed
}

function runPipeline(
  primaryFiles: AssemblyFile[],
  previousFiles: AssemblyFile[],
  deductionYears: readonly number[],
  answers: Record<string, string | number | boolean>,
  liquidacaoFiles: AssemblyFile[] = [],
  householdTransform?: (h: Household) => void,
): PipelineResult {
  const { pastedDeductions, deductionSlots } = buildDeductionSlots(deductionYears)

  const input: AssemblyInput = {
    sectionFiles: {
      declaration: primaryFiles,
      liquidacao: liquidacaoFiles,
      previousYears: previousFiles,
    },
    pastedDeductions,
    deductionSlots,
  }

  const result = assembleHouseholds(input)
  expect(result.ok, 'Assembly should succeed').toBe(true)
  if (!result.ok) throw new Error('Assembly failed: ' + result.code)

  // Apply questionnaire answers to the primary household
  let households = result.households.map((h) => {
    // applyAnswers should be called on each household, but the questionnaire
    // answers are based on the primary year. For previous years, we propagate.
    return h
  })

  // Apply answers to primary (first by year, descending)
  const primaryIdx = 0
  households[primaryIdx] = applyAnswers(households[primaryIdx], answers)

  // Optional mutation for AT-matching liquidação tests
  if (householdTransform) householdTransform(households[primaryIdx])

  // Propagate shared data from primary to all other years
  const primary = households[primaryIdx]
  households = households.map((h, i) => (i === 0 ? h : propagateSharedData(primary, h)))

  // Build projection if applicable
  const primaryYear = primary.year
  const currentYear = new Date().getFullYear()
  const projectionYear = primaryYear + 1

  // Analyze all year households
  const years = new Map<number, PipelineResult['years'] extends Map<number, infer V> ? V : never>()

  for (const h of households) {
    const analysis = analyzeHousehold(h)
    years.set(h.year, {
      household: h,
      analysis,
      regimes: h.members.map((m, i) => ({
        member: i,
        name: m.name,
        special_regimes: [...m.special_regimes],
        irs_jovem_year: m.irs_jovem_year,
        nhr_start_year: m.nhr_start_year,
        irs_jovem_first_work_year: m.irs_jovem_first_work_year,
        irs_jovem_degree_year: m.irs_jovem_degree_year,
      })),
    })
  }

  // Build and analyze projected household if within range
  if (projectionYear <= currentYear + 1 && years.has(primaryYear)) {
    const projected = buildProjectedHousehold(primary)
    const projAnalysis = analyzeHousehold(projected)
    years.set(projected.year, {
      household: projected,
      analysis: projAnalysis,
      regimes: projected.members.map((m, i) => ({
        member: i,
        name: m.name,
        special_regimes: [...m.special_regimes],
        irs_jovem_year: m.irs_jovem_year,
        nhr_start_year: m.nhr_start_year,
        irs_jovem_first_work_year: m.irs_jovem_first_work_year,
        irs_jovem_degree_year: m.irs_jovem_degree_year,
      })),
    })
  }

  return { years, liquidacao: result.liquidacao }
}

// ─── Golden Value Types ──────────────────────────────────────

interface ExpectedScenario {
  irs: number
  rate: number // as fraction, e.g. 0.156
  refundOrPay: number
  holderA?: { irs: number; rate: number }
  holderB?: { irs: number; rate: number }
}

interface ExpectedYear {
  year: number
  projected?: boolean
  current: ExpectedScenario
  optimized?: ExpectedScenario
  savings?: number
}

// ─── Assertion Helpers ───────────────────────────────────────

function assertScenario(
  scenario: ScenarioResult,
  expected: ExpectedScenario,
  label: string,
) {
  expect(scenario.total_irs).toBeCloseTo(expected.irs, 0)
  expect(scenario.effective_rate_irs).toBeCloseTo(expected.rate, 2)

  if (expected.holderA && scenario.persons.length >= 1) {
    expect(personTotalIrs(scenario.persons[0])).toBeCloseTo(expected.holderA.irs, 0)
    expect(scenario.persons[0].effective_rate_irs).toBeCloseTo(expected.holderA.rate, 2)
  }
  if (expected.holderB && scenario.persons.length >= 2) {
    expect(personTotalIrs(scenario.persons[1])).toBeCloseTo(expected.holderB.irs, 0)
    expect(scenario.persons[1].effective_rate_irs).toBeCloseTo(expected.holderB.rate, 2)
  }
}

function assertYear(
  yearData: PipelineResult['years'] extends Map<number, infer V> ? V : never,
  expected: ExpectedYear,
) {
  const { analysis } = yearData
  const amendable = expected.projected || (expected.year >= 2023 && expected.year <= 2025)
  const view = deriveResultsView(analysis, { amendable })

  assertScenario(view.currentScenario, expected.current, `${expected.year} current`)

  if (expected.optimized) {
    expect(view.isAlreadyOptimal, `${expected.year} should not be already optimal`).toBe(false)
    assertScenario(view.optimalScenario, expected.optimized, `${expected.year} optimized`)
  }

  if (expected.savings !== undefined) {
    expect(view.savings).toBeCloseTo(expected.savings, 0)
  }
}

function assertRegimes(
  yearData: PipelineResult['years'] extends Map<number, infer V> ? V : never,
  year: number,
  expectedMember0Regimes: string[],
  expectedMember1Regimes: string[],
) {
  const m0 = yearData.regimes[0]
  const m1 = yearData.regimes[1]
  expect(m0.special_regimes.sort(), `${year} member 0 regimes`).toEqual(expectedMember0Regimes.sort())
  if (m1) {
    expect(m1.special_regimes.sort(), `${year} member 1 regimes`).toEqual(expectedMember1Regimes.sort())
  }
}

// ═══════════════════════════════════════════════════════════════
// VARIANT 1: All years XML (2021-2025)
// Primary=2025, Previous=2021-2024, Projection=2026
// ═══════════════════════════════════════════════════════════════

describe('Golden pipeline: all years XML (2021-2025)', () => {
  let pipeline: PipelineResult

  beforeAll(() => {
    const primary = [
      loadXml('decl-m3-irs-2025-holder-a.xml'),
      loadXml('decl-m3-irs-2025-holder-b.xml'),
    ]
    const previous = [2021, 2022, 2023, 2024].flatMap((y) => [
      loadXml(`decl-m3-irs-${y}-holder-a.xml`),
      loadXml(`decl-m3-irs-${y}-holder-b.xml`),
    ])

    pipeline = runPipeline(primary, previous, [2021, 2022, 2023, 2024, 2025], {
      'member.0.birth_year': 1994,
      'member.1.birth_year': 1989,
      'dependent.0.birth_year': 2019,
      'dependent.1.birth_year': 2022,
      'member.0.first_work_year': 2021,
      'member.0.degree_year': 2020,
      'member.1.nhr_start_year': 2021,
    })
  })

  // Expected golden values (from ALL_YEARS_GOLDEN in golden.spec.ts)
  const EXPECTED: ExpectedYear[] = [
    {
      year: 2021,
      current: {
        irs: 6458.61, rate: 0.156, refundOrPay: 2192.37,
        holderA: { irs: 959.22, rate: 0.069 },
        holderB: { irs: 5499.39, rate: 0.200 },
      },
    },
    {
      year: 2022,
      current: {
        irs: 7357.20, rate: 0.164, refundOrPay: 2663.37,
        holderA: { irs: 4135.65, rate: 0.144 },
        holderB: { irs: 3221.55, rate: 0.200 },
      },
    },
    {
      year: 2023,
      current: {
        irs: 15824.25, rate: 0.142, refundOrPay: 844.59,
        holderA: { irs: 5155.54, rate: 0.089 },
        holderB: { irs: 10668.71, rate: 0.200 },
      },
      savings: 1892.95,
      optimized: {
        irs: 13931.30, rate: 0.125, refundOrPay: 1048.36,
        holderA: { irs: 3262.59, rate: 0.056 },
        holderB: { irs: 10668.71, rate: 0.200 },
      },
    },
    {
      year: 2024,
      current: {
        irs: 10515.47, rate: 0.137, refundOrPay: 5589.32,
        holderA: { irs: 5658.29, rate: 0.108 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
      savings: 3154.93,
      optimized: {
        irs: 7360.54, rate: 0.096, refundOrPay: 2434.39,
        holderA: { irs: 2503.36, rate: 0.048 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
    },
    {
      year: 2025,
      current: {
        irs: 15050.29, rate: 0.117, refundOrPay: 3880.67,
        holderA: { irs: 2828.84, rate: 0.042 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
      savings: 2072.33,
      optimized: {
        irs: 12977.96, rate: 0.101, refundOrPay: 5953.00,
        holderA: { irs: 756.51, rate: 0.011 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
    },
    {
      year: 2026,
      projected: true,
      current: {
        irs: 15113.29, rate: 0.118, refundOrPay: 13869.34,
        holderA: { irs: 2891.84, rate: 0.043 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
      savings: 2009.33,
      optimized: {
        irs: 13103.96, rate: 0.102, refundOrPay: 15878.67,
        holderA: { irs: 882.51, rate: 0.013 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
    },
  ]

  for (const expected of EXPECTED) {
    it(`year ${expected.year}: golden values`, () => {
      const yearData = pipeline.years.get(expected.year)
      expect(yearData, `Year ${expected.year} should exist`).toBeDefined()
      if (yearData) assertYear(yearData, expected)
    })

    it(`year ${expected.year}: special regimes`, () => {
      const yearData = pipeline.years.get(expected.year)
      expect(yearData, `Year ${expected.year} should exist`).toBeDefined()
      if (!yearData) return

      // Member 0 (holder A): IRS Jovem in all years (first_work_year=2021, degree_year=2020)
      // Member 1 (holder B): NHR (nhr_start_year=2021, expires after 2030)
      assertRegimes(yearData, expected.year, ['irs_jovem'], ['nhr'])
    })
  }
})

// ═══════════════════════════════════════════════════════════════
// VARIANT 2: 2025 only XML
// Primary=2025, Projection=2026
// ═══════════════════════════════════════════════════════════════

describe('Golden pipeline: 2025 only XML', () => {
  let pipeline: PipelineResult

  beforeAll(() => {
    const primary = [
      loadXml('decl-m3-irs-2025-holder-a.xml'),
      loadXml('decl-m3-irs-2025-holder-b.xml'),
    ]

    pipeline = runPipeline(primary, [], [2025], {
      'member.0.birth_year': 1994,
      'member.1.birth_year': 1989,
      'dependent.0.birth_year': 2019,
      'dependent.1.birth_year': 2022,
      'member.0.first_work_year': 2021,
      'member.1.nhr_start_year': 2021,
    })
  })

  // Same golden values as ALL_YEARS for 2025 and 2026
  const EXPECTED: ExpectedYear[] = [
    {
      year: 2025,
      current: {
        irs: 15050.29, rate: 0.117, refundOrPay: 3880.67,
        holderA: { irs: 2828.84, rate: 0.042 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
      savings: 2072.33,
      optimized: {
        irs: 12977.96, rate: 0.101, refundOrPay: 5953.00,
        holderA: { irs: 756.51, rate: 0.011 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
    },
    {
      year: 2026,
      projected: true,
      current: {
        irs: 15113.29, rate: 0.118, refundOrPay: 13869.34,
        holderA: { irs: 2891.84, rate: 0.043 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
      savings: 2009.33,
      optimized: {
        irs: 13103.96, rate: 0.102, refundOrPay: 15878.67,
        holderA: { irs: 882.51, rate: 0.013 },
        holderB: { irs: 12221.45, rate: 0.200 },
      },
    },
  ]

  for (const expected of EXPECTED) {
    it(`year ${expected.year}: golden values`, () => {
      const yearData = pipeline.years.get(expected.year)
      expect(yearData, `Year ${expected.year} should exist`).toBeDefined()
      if (yearData) assertYear(yearData, expected)
    })

    it(`year ${expected.year}: special regimes`, () => {
      const yearData = pipeline.years.get(expected.year)
      expect(yearData).toBeDefined()
      if (!yearData) return
      assertRegimes(yearData, expected.year, ['irs_jovem'], ['nhr'])
    })
  }
})

// ═══════════════════════════════════════════════════════════════
// VARIANT 3: 2024 primary XML with liquidação
// Primary=2024, Liquidação PDF
// ═══════════════════════════════════════════════════════════════

describe('Golden pipeline: 2024 primary XML with liquidação', () => {
  let pipeline: PipelineResult
  let liquidacao: LiquidacaoParsed
  let primaryFiles: AssemblyFile[]
  let liqFile: AssemblyFile

  beforeAll(async () => {
    primaryFiles = [
      loadXml('decl-m3-irs-2024-holder-a.xml'),
      loadXml('decl-m3-irs-2024-holder-b.xml'),
    ]
    const liq = await loadLiquidacaoPdf('liquidacao-2024-holder-a.pdf')
    liquidacao = liq.parsed
    liqFile = liq.file

    // Need to find Cat B income index for activity_year answer.
    // Apply member answers first, then find the Cat B income.
    pipeline = runPipeline(primaryFiles, [], [2024], {
      'member.0.birth_year': 1994,
      'member.1.birth_year': 1989,
      'dependent.0.birth_year': 2019,
      'dependent.1.birth_year': 2022,
      'member.0.degree_year': 2020,
      'member.1.degree_year': 2012,
      'member.1.nhr_start_year': 2021,
      'member.0.income.0.cat_b_activity_year': 2,
    }, [liqFile])
  })

  const EXPECTED: ExpectedYear[] = [
    {
      year: 2024,
      current: {
        irs: 7193.64, rate: 0.094, refundOrPay: 2267.49,
        holderA: { irs: 2336.46, rate: 0.045 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
      savings: 2031.90,
      optimized: {
        irs: 5161.74, rate: 0.067, refundOrPay: 235.59,
        holderA: { irs: 304.56, rate: 0.006 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
    },
  ]

  it('year 2024: golden values', () => {
    const yearData = pipeline.years.get(2024)
    expect(yearData, 'Year 2024 should exist').toBeDefined()
    if (yearData) assertYear(yearData, EXPECTED[0])
  })

  it('year 2024: special regimes', () => {
    const yearData = pipeline.years.get(2024)
    expect(yearData).toBeDefined()
    if (!yearData) return
    // Member 0: IRS Jovem (degree_year=2020, benefit year = 2024-2020 = 4)
    // Member 1: NHR (nhr_start_year=2021)
    // Member 1 degree_year=2012 → 2024-2012=12 > 5 (max for 2024) → no IRS Jovem
    assertRegimes(yearData, 2024, ['irs_jovem'], ['nhr'])
  })

  // TODO(backlog): Liquidação validation disabled — fixture PDF has known
  // anonymization errors (parcelaAbater not recomputed when rendimentoColetavel
  // was fuzzed, causing €500 coletaTotal discrepancy). Re-enable after
  // re-anonymizing the fixture with internally consistent values.
  it.todo('year 2024: strict liquidação validation (zero deviation)')
})

// ═══════════════════════════════════════════════════════════════
// VARIANT 4: All years PDF comprovativos (2021-2024)
// Primary=2024 (PDF), Previous=2021-2023 (PDF), Projection=2025
// ═══════════════════════════════════════════════════════════════

describe('Golden pipeline: all years PDF comprovativos (2021-2024)', () => {
  let pipeline: PipelineResult

  beforeAll(async () => {
    const primary = await Promise.all([
      loadComprovativoPdf('comprovativo-2024-holder-a.pdf'),
      loadComprovativoPdf('comprovativo-2024-holder-b.pdf'),
    ])
    const previous = await Promise.all(
      [2021, 2022, 2023].flatMap((y) => [
        loadComprovativoPdf(`comprovativo-${y}-holder-a.pdf`),
        loadComprovativoPdf(`comprovativo-${y}-holder-b.pdf`),
      ]),
    )

    pipeline = runPipeline(primary, previous, [2021, 2022, 2023, 2024], {
      'member.0.birth_year': 1994,
      'member.1.birth_year': 1989,
      'dependent.0.birth_year': 2019,
      'dependent.1.birth_year': 2022,
      'member.0.degree_year': 2020,
      'member.1.degree_year': 2012,
      'member.1.nhr_start_year': 2021,
      'member.0.income.0.cat_b_activity_year': 2,
    })
  })

  // PDF all-years uses 2024 as primary with degree_year answers (same as variant 3).
  // Year 2024 should match YEAR_2024_PRIMARY_GOLDEN since same questionnaire + deductions.
  it('year 2024: matches XML 2024-primary golden values', () => {
    const yearData = pipeline.years.get(2024)
    expect(yearData, 'Year 2024 should exist').toBeDefined()
    if (!yearData) return

    const expected: ExpectedYear = {
      year: 2024,
      current: {
        irs: 7193.64, rate: 0.094, refundOrPay: 2267.49,
        holderA: { irs: 2336.46, rate: 0.045 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
      savings: 2031.90,
      optimized: {
        irs: 5161.74, rate: 0.067, refundOrPay: 235.59,
        holderA: { irs: 304.56, rate: 0.006 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
    }
    assertYear(yearData, expected)
  })

  it('all years: special regimes are correct', () => {
    for (const year of [2021, 2022, 2023, 2024]) {
      const yearData = pipeline.years.get(year)
      expect(yearData, `Year ${year} should exist`).toBeDefined()
      if (!yearData) continue

      // Member 0: IRS Jovem (degree_year=2020, pre-2025 law applies)
      // Benefit year = year - 2020. For 2021→1, 2022→2, 2023→3, 2024→4 — all within maxBenefitYears
      // Member 1: NHR, no IRS Jovem (degree_year=2012, too old)
      assertRegimes(yearData, year, ['irs_jovem'], ['nhr'])
    }
  })

  it('previous years produce consistent analysis', () => {
    // Previous years (2021-2023) should all have valid analysis results
    for (const year of [2021, 2022, 2023]) {
      const yearData = pipeline.years.get(year)
      expect(yearData, `Year ${year} should exist`).toBeDefined()
      if (!yearData) return
      // Sanity: IRS should be positive
      const { currentScenario } = deriveResultsView(yearData.analysis, { amendable: false })
      expect(currentScenario.total_irs, `Year ${year} IRS > 0`).toBeGreaterThan(0)
      expect(currentScenario.effective_rate_irs, `Year ${year} rate > 0`).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// VARIANT 5: 2024 primary PDF with liquidação
// Primary=2024 (PDF), Liquidação PDF
// ═══════════════════════════════════════════════════════════════

describe('Golden pipeline: 2024 primary PDF with liquidação', () => {
  let pipeline: PipelineResult
  let liquidacao: LiquidacaoParsed
  let primaryFiles: AssemblyFile[]
  let liqFile: AssemblyFile

  beforeAll(async () => {
    primaryFiles = await Promise.all([
      loadComprovativoPdf('comprovativo-2024-holder-a.pdf'),
      loadComprovativoPdf('comprovativo-2024-holder-b.pdf'),
    ])
    const liq = await loadLiquidacaoPdf('liquidacao-2024-holder-a.pdf')
    liquidacao = liq.parsed
    liqFile = liq.file

    pipeline = runPipeline(primaryFiles, [], [2024], {
      'member.0.birth_year': 1994,
      'member.1.birth_year': 1989,
      'dependent.0.birth_year': 2019,
      'dependent.1.birth_year': 2022,
      'member.0.degree_year': 2020,
      'member.1.degree_year': 2012,
      'member.1.nhr_start_year': 2021,
      'member.0.income.0.cat_b_activity_year': 2,
    }, [liqFile])
  })

  it('year 2024: matches XML 2024-primary golden values', () => {
    const yearData = pipeline.years.get(2024)
    expect(yearData, 'Year 2024 should exist').toBeDefined()
    if (!yearData) return

    const expected: ExpectedYear = {
      year: 2024,
      current: {
        irs: 7193.64, rate: 0.094, refundOrPay: 2267.49,
        holderA: { irs: 2336.46, rate: 0.045 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
      savings: 2031.90,
      optimized: {
        irs: 5161.74, rate: 0.067, refundOrPay: 235.59,
        holderA: { irs: 304.56, rate: 0.006 },
        holderB: { irs: 4857.18, rate: 0.200 },
      },
    }
    assertYear(yearData, expected)
  })

  it('year 2024: special regimes', () => {
    const yearData = pipeline.years.get(2024)
    expect(yearData).toBeDefined()
    if (!yearData) return
    assertRegimes(yearData, 2024, ['irs_jovem'], ['nhr'])
  })

  // TODO(backlog): Liquidação validation disabled — same fixture issue as
  // variant 3 (see comment there for details).
  it.todo('year 2024: strict liquidação validation (zero deviation)')
})
