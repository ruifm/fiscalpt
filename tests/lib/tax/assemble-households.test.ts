import { describe, it, expect } from 'vitest'
import {
  assembleHouseholds,
  LIQUIDACAO_DEDUCTION_MAP,
  DEFAULT_GENERAL_DEDUCTION_AMOUNT,
  type AssemblyFile,
  type AssemblySectionFiles,
  type AssemblyInput,
} from '../../../src/lib/tax/assemble-households'
import type { Household, Person } from '../../../src/lib/tax/types'
import type { ParsedXmlResult } from '../../../src/lib/tax/xml-parser'
import type { LiquidacaoParsed, ComprovativoParsed } from '../../../src/lib/tax/pdf-extractor'
import type { DeductionSlot } from '../../../src/lib/tax/upload-validation'
import type { DeductionsParseResult } from '../../../src/lib/tax/deductions-parser'

// ─── Test Helpers ────────────────────────────────────────────

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    name: 'Test Person',
    incomes: [{ category: 'A', gross: 30000 }],
    deductions: [],
    special_regimes: [],
    ...overrides,
  }
}

function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    year: 2024,
    filing_status: 'single',
    members: [makePerson()],
    dependents: [],
    ...overrides,
  }
}

function makeParsedXml(
  household: Household,
  nif = '123456789',
  nifConjuge?: string,
): ParsedXmlResult {
  return {
    household,
    raw: {
      subjectA_nif: nif,
      subjectA_name: household.members[0]?.name ?? 'Test',
      subjectB_nif: nifConjuge,
      year: household.year,
      civilStatus: nifConjuge ? 2 : 1,
      dependents: [],
      godchildren: [],
      ascendants: [],
      anexoB: [],
      anexoSS: [],
      catAIncomeCodes: [],
      anexosPresent: [],
    },
    issues: [],
  }
}

function makeDeclFile(household: Household, nif = '123456789', nifConjuge?: string): AssemblyFile {
  return {
    fileName: 'decl.xml',
    status: 'done',
    nif,
    year: household.year,
    nifConjuge,
    parsedXml: makeParsedXml(household, nif, nifConjuge),
  }
}

function emptySections(): AssemblySectionFiles {
  return { declaration: [], liquidacao: [], previousYears: [] }
}

function baseInput(sectionFiles: AssemblySectionFiles = emptySections()): AssemblyInput {
  return {
    sectionFiles,
    pastedDeductions: new Map(),
    deductionSlots: [],
  }
}

function expectOnlyDefaultDeduction(deductions: { category: string; amount: number }[]) {
  expect(deductions).toHaveLength(1)
  expect(deductions[0].category).toBe('general')
  expect(deductions[0].amount).toBe(DEFAULT_GENERAL_DEDUCTION_AMOUNT)
}

// ─── Error Cases ─────────────────────────────────────────────

describe('assembleHouseholds', () => {
  describe('error cases', () => {
    it('returns NEED_DECLARATION when no declaration files exist', () => {
      const result = assembleHouseholds(baseInput())

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('NEED_DECLARATION')
      }
    })

    it('returns STILL_PROCESSING when any file is processing', () => {
      const sections = emptySections()
      sections.declaration = [{ fileName: 'a.xml', status: 'processing' }]
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('STILL_PROCESSING')
      }
    })

    it('returns STILL_PROCESSING when liquidacao file is processing', () => {
      const h = makeHousehold()
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [{ fileName: 'liq.pdf', status: 'processing' }],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('STILL_PROCESSING')
      }
    })

    it('returns STILL_PROCESSING when previousYears file is processing', () => {
      const h = makeHousehold()
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [],
        previousYears: [{ fileName: 'prev.xml', status: 'processing' }],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('STILL_PROCESSING')
      }
    })

    it('returns EXTRACTION_FAILED when declaration has no parseable data', () => {
      const sections: AssemblySectionFiles = {
        declaration: [{ fileName: 'bad.xml', status: 'done' }],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('EXTRACTION_FAILED')
      }
    })

    it('returns VALIDATION_FAILED when pre-validation produces errors', () => {
      const h = makeHousehold()
      // 3 declarations triggers "Máximo de 2 declarações" error (severity undefined = error)
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h), makeDeclFile(h), makeDeclFile(h)],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBe('VALIDATION_FAILED')
        expect(result.validationMessages!.length).toBeGreaterThan(0)
      }
    })
  })

  // ─── Single Declaration ──────────────────────────────────

  describe('single declaration assembly', () => {
    it('assembles a single XML declaration into one household', () => {
      const h = makeHousehold({ year: 2024 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
        expect(result.households[0].year).toBe(2024)
        expect(result.households[0].members).toHaveLength(1)
        expect(result.issues).toEqual([])
        expect(result.liquidacao).toBeUndefined()
      }
    })

    it('skips files with error status', () => {
      const h = makeHousehold()
      const sections: AssemblySectionFiles = {
        declaration: [{ fileName: 'err.xml', status: 'error' }, makeDeclFile(h)],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
      }
    })

    it('skips files with pending status', () => {
      const h = makeHousehold()
      const sections: AssemblySectionFiles = {
        declaration: [{ fileName: 'pending.xml', status: 'pending' }, makeDeclFile(h)],
        liquidacao: [],
        previousYears: [],
      }
      // pending files shouldn't trigger STILL_PROCESSING since
      // that only checks for 'processing' status
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
    })

    it('propagates issues from parsed XML', () => {
      const h = makeHousehold()
      const xml = makeParsedXml(h)
      xml.issues = [
        {
          severity: 'warning',
          code: 'MISSING_FIELD',
          message: 'Some field missing',
        },
      ]
      const sections: AssemblySectionFiles = {
        declaration: [
          {
            fileName: 'decl.xml',
            status: 'done',
            nif: '123456789',
            year: 2024,
            parsedXml: xml,
          },
        ],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.issues).toHaveLength(1)
        expect(result.issues[0].code).toBe('MISSING_FIELD')
      }
    })
  })

  // ─── Liquidação ──────────────────────────────────────────

  describe('liquidação assembly', () => {
    it('includes liquidação in result when present', () => {
      const h = makeHousehold({ year: 2024 })
      const liq: LiquidacaoParsed = {
        year: 2024,
        nif: '123456789',
        rendimentoGlobal: 30000,
      }
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.liquidacao).toBeDefined()
        expect(result.liquidacao?.year).toBe(2024)
      }
    })

    it('adds YEAR_MISMATCH issue when liquidação year differs from declaration', () => {
      const h = makeHousehold({ year: 2024 })
      const liq: LiquidacaoParsed = { year: 2023, nif: '123456789' }
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const yearMismatch = result.issues.find((i) => i.code === 'YEAR_MISMATCH')
        expect(yearMismatch).toBeDefined()
        expect(yearMismatch?.severity).toBe('error')
      }
    })

    it('uses last liquidação when multiple exist (existing behavior)', () => {
      const h = makeHousehold({ year: 2024 })
      const liq1: LiquidacaoParsed = {
        year: 2024,
        nif: '111111111',
        rendimentoGlobal: 20000,
      }
      const liq2: LiquidacaoParsed = {
        year: 2024,
        nif: '222222222',
        rendimentoGlobal: 40000,
      }
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq1.pdf',
            status: 'done',
            parsedLiquidacao: liq1,
          },
          {
            fileName: 'liq2.pdf',
            status: 'done',
            parsedLiquidacao: liq2,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.liquidacao?.nif).toBe('222222222')
      }
    })

    it('skips error-status liquidação files', () => {
      const h = makeHousehold({ year: 2024 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'bad.pdf',
            status: 'error',
            parsedLiquidacao: { year: 2024, nif: '111111111' },
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.liquidacao).toBeUndefined()
      }
    })
  })

  // ─── Previous Years ──────────────────────────────────────

  describe('previous years assembly', () => {
    it('assembles previous year declarations', () => {
      const h2024 = makeHousehold({ year: 2024 })
      const h2023 = makeHousehold({ year: 2023 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h2024)],
        liquidacao: [],
        previousYears: [makeDeclFile(h2023, '123456789')],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(2)
        expect(result.households[0].year).toBe(2024)
        expect(result.households[1].year).toBe(2023)
      }
    })

    it('sorts households by year descending', () => {
      const h2024 = makeHousehold({ year: 2024 })
      const h2022 = makeHousehold({ year: 2022 })
      const h2023 = makeHousehold({ year: 2023 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h2024)],
        liquidacao: [],
        previousYears: [makeDeclFile(h2022, '123456789'), makeDeclFile(h2023, '123456789')],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households.map((h) => h.year)).toEqual([2024, 2023, 2022])
      }
    })

    it('adds YEAR_OVERLAP warning when previous year matches declaration year', () => {
      const h2024 = makeHousehold({ year: 2024 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h2024)],
        liquidacao: [],
        previousYears: [makeDeclFile(h2024, '123456789')],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Only primary household — duplicate skipped
        expect(result.households).toHaveLength(1)
        const overlap = result.issues.find((i) => i.code === 'YEAR_OVERLAP')
        expect(overlap).toBeDefined()
        expect(overlap?.severity).toBe('warning')
      }
    })

    it('returns previous-years-only households when no primary extracted', () => {
      const h2023 = makeHousehold({ year: 2023 })
      const sections: AssemblySectionFiles = {
        // declaration exists but has no parseable data
        declaration: [{ fileName: 'bad.xml', status: 'done' }],
        liquidacao: [],
        previousYears: [makeDeclFile(h2023, '123456789')],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
        expect(result.households[0].year).toBe(2023)
      }
    })

    it('skips previous year files without parsedXml', () => {
      const h2024 = makeHousehold({ year: 2024 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h2024)],
        liquidacao: [],
        previousYears: [
          {
            fileName: 'prev-no-xml.pdf',
            status: 'done',
            year: 2023,
            // no parsedXml
          },
        ],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
      }
    })
  })

  // ─── Pasted Deductions ───────────────────────────────────

  describe('pasted deductions', () => {
    it('merges taxpayer deductions by name match', () => {
      const h = makeHousehold({
        year: 2025,
        members: [makePerson({ name: 'João Silva' })],
      })
      const slot: DeductionSlot = {
        key: 'tp-111-2025',
        nif: '111111111',
        year: 2025,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '111111111',
          name: 'João Silva',
          year: 2025,
          expenses: [
            {
              category: 'health',
              expenseAmount: 500,
              deductionAmount: 75,
            },
            {
              category: 'general',
              expenseAmount: 1200,
              deductionAmount: 250,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['tp-111-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions).toHaveLength(2)
        expect(member.deductions.find((d) => d.category === 'health')?.amount).toBe(500)
        expect(member.deductions.find((d) => d.category === 'general')?.amount).toBe(1200)
      }
    })

    it('skips deductions for wrong year', () => {
      const h = makeHousehold({ year: 2024 })
      const slot: DeductionSlot = {
        key: 'tp-111-2025',
        nif: '111111111',
        year: 2025,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '111111111',
          name: 'Test',
          year: 2025,
          expenses: [
            {
              category: 'health',
              expenseAmount: 500,
              deductionAmount: 75,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['tp-111-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })

    it('skips deductions with failed parse result', () => {
      const h = makeHousehold({ year: 2025 })
      const slot: DeductionSlot = {
        key: 'tp-111-2025',
        nif: '111111111',
        year: 2025,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const failedResult: DeductionsParseResult = {
        ok: false,
        error: 'parse failed',
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['tp-111-2025', { text: 'pasted', result: failedResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })

    it('merges dependent/ascendant deductions into first member', () => {
      const h = makeHousehold({
        year: 2025,
        members: [makePerson({ name: 'Parent' })],
        dependents: [{ name: 'Child', birth_year: 2020 }],
      })
      const slot: DeductionSlot = {
        key: 'dep-222-2025',
        nif: '222222222',
        year: 2025,
        role: 'dependent',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '222222222',
          name: 'Child',
          year: 2025,
          expenses: [
            {
              category: 'education',
              expenseAmount: 800,
              deductionAmount: 240,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['dep-222-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions.find((d) => d.category === 'education')?.amount).toBe(800)
      }
    })

    it('accumulates dependent deductions into existing category amounts', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Parent',
            deductions: [{ category: 'education', amount: 200 }],
          }),
        ],
      })
      const slot: DeductionSlot = {
        key: 'dep-222-2025',
        nif: '222222222',
        year: 2025,
        role: 'dependent',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '222222222',
          name: 'Child',
          year: 2025,
          expenses: [
            {
              category: 'education',
              expenseAmount: 600,
              deductionAmount: 180,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['dep-222-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions.find((d) => d.category === 'education')?.amount).toBe(800) // 200 + 600
      }
    })

    it('replaces existing taxpayer deductions of same category', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'João',
            deductions: [{ category: 'health', amount: 100 }],
          }),
        ],
      })
      const slot: DeductionSlot = {
        key: 'tp-111-2025',
        nif: '111111111',
        year: 2025,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '111111111',
          name: 'João',
          year: 2025,
          expenses: [
            {
              category: 'health',
              expenseAmount: 999,
              deductionAmount: 150,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['tp-111-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions.filter((d) => d.category === 'health')).toHaveLength(1)
        expect(member.deductions.find((d) => d.category === 'health')?.amount).toBe(999)
      }
    })

    it('skips zero-amount expenses', () => {
      const h = makeHousehold({
        year: 2025,
        members: [makePerson({ name: 'João' })],
      })
      const slot: DeductionSlot = {
        key: 'tp-111-2025',
        nif: '111111111',
        year: 2025,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif: '111111111',
          name: 'João',
          year: 2025,
          expenses: [
            { category: 'health', expenseAmount: 0, deductionAmount: 0 },
            {
              category: 'general',
              expenseAmount: 500,
              deductionAmount: 175,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111111111')],
        liquidacao: [],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([['tp-111-2025', { text: 'pasted', result: deductionResult }]]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions).toHaveLength(1)
        expect(member.deductions[0].category).toBe('general')
      }
    })
  })

  // ─── Liquidação Deduction Fallback ───────────────────────

  describe('liquidação deduction fallback', () => {
    it('derives deductions from liquidação when no pasted data exists', () => {
      const h = makeHousehold({ year: 2024 })
      const liq: LiquidacaoParsed = {
        year: 2024,
        nif: '123456789',
        deducoesGerais: 250, // expense = 250/0.35 ≈ 714.29
        deducoesSaude: 150, // expense = 150/0.15 = 1000
      }
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        expect(member.deductions).toHaveLength(2)
        expect(member.deductions.find((d) => d.category === 'general')?.amount).toBeCloseTo(
          714.29,
          1,
        )
        expect(member.deductions.find((d) => d.category === 'health')?.amount).toBeCloseTo(1000, 1)
      }
    })

    it('does not override pasted deductions with liquidação fallback', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'João' })],
      })
      const nif = '123456789'
      const liq: LiquidacaoParsed = {
        year: 2024,
        nif,
        deducoesGerais: 250,
      }
      const slot: DeductionSlot = {
        key: `tp-${nif}-2024`,
        nif,
        year: 2024,
        role: 'taxpayer',
        hasLiquidacao: true,
      }
      const deductionResult: DeductionsParseResult = {
        ok: true,
        data: {
          nif,
          name: 'João',
          year: 2024,
          expenses: [
            {
              category: 'general',
              expenseAmount: 5000,
              deductionAmount: 250,
            },
          ],
        },
      }

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, nif)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const input: AssemblyInput = {
        sectionFiles: sections,
        pastedDeductions: new Map([
          [`tp-${nif}-2024`, { text: 'pasted', result: deductionResult }],
        ]),
        deductionSlots: [slot],
      }
      const result = assembleHouseholds(input)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const member = result.households[0].members[0]
        // Pasted value should be used, not liquidação-derived
        expect(member.deductions.find((d) => d.category === 'general')?.amount).toBe(5000)
      }
    })

    it('skips zero or negative liquidação deduction values', () => {
      const h = makeHousehold({ year: 2024 })
      const liq: LiquidacaoParsed = {
        year: 2024,
        nif: '123456789',
        deducoesGerais: 0,
        deducoesSaude: -10,
      }
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })
  })

  // ─── Constants ───────────────────────────────────────────

  describe('LIQUIDACAO_DEDUCTION_MAP', () => {
    it('has correct mapping entries', () => {
      expect(LIQUIDACAO_DEDUCTION_MAP).toHaveLength(4)
      expect(LIQUIDACAO_DEDUCTION_MAP.map((m) => m.category)).toEqual([
        'general',
        'health',
        'education',
        'fatura',
      ])
    })

    it('has valid rates', () => {
      for (const m of LIQUIDACAO_DEDUCTION_MAP) {
        expect(m.rate).toBeGreaterThan(0)
        expect(m.rate).toBeLessThan(1)
      }
    })
  })

  // ─── Result type narrowing ───────────────────────────────

  describe('result types', () => {
    it('failure result has code but no households', () => {
      const result = assembleHouseholds(baseInput())

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.code).toBeDefined()
        expect('households' in result).toBe(false)
      }
    })

    it('success result has households and issues', () => {
      const h = makeHousehold()
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(Array.isArray(result.households)).toBe(true)
        expect(Array.isArray(result.issues)).toBe(true)
      }
    })
  })

  // ─── Comprovativo Fallback ──────────────────────────────────

  describe('comprovativo fallback', () => {
    it('uses comprovativo when no XML is available', () => {
      const comprovativo: ComprovativoParsed = {
        nif: '111222333',
        year: 2024,
        filingStatus: 'single',
        anexoA: [
          {
            titular: 'A',
            rendimentoBruto: 25000,
            retencoesIRS: 4000,
            contribuicoesSS: 2750,
          },
        ],
        issues: [],
      }
      const sections: AssemblySectionFiles = {
        declaration: [
          {
            fileName: 'comp.pdf',
            status: 'done',
            nif: '111222333',
            year: 2024,
            parsedComprovativo: comprovativo,
          },
        ],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
        expect(result.issues.some((i) => i.code === 'PDF_FALLBACK')).toBe(true)
      }
    })
  })

  // ─── Previous Years Non-Merged ──────────────────────────────

  describe('previous years non-merged path', () => {
    it('uses first declaration when mergeSpouseHouseholds returns null for previous year', () => {
      const primary = makeHousehold({ year: 2024 })
      const prev = makeHousehold({
        year: 2023,
        members: [makePerson({ name: 'PrevPerson' })],
      })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(primary)],
        liquidacao: [],
        // Single previous-year file — mergeSpouseHouseholds returns null for 1 decl
        previousYears: [
          {
            fileName: 'prev.xml',
            status: 'done',
            nif: '111222333',
            year: 2023,
            parsedXml: makeParsedXml(prev, '111222333'),
          },
        ],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(2)
        expect(result.households.map((h) => h.year)).toContain(2023)
      }
    })
  })

  // ─── Deduction NIF Matching ────────────────────────────────

  describe('deduction member matching by NIF', () => {
    it('matches pasted deductions to member via declaration file NIF', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' })],
      })
      const declFile = makeDeclFile(h, '111222333')
      const deductionSlots: DeductionSlot[] = [
        {
          key: 'taxpayer-111222333',
          nif: '111222333',
          year: 2024,
          role: 'taxpayer',
          hasLiquidacao: false,
        },
      ]
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          'taxpayer-111222333',
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif: '111222333',
                name: 'Matched Person',
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 500, deductionAmount: 75 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        const alice = result.households[0].members[0]
        expect(alice.deductions.some((d) => d.category === 'health' && d.amount === 500)).toBe(true)
      }
    })
  })

  // ─── Liquidação Deduction Override ─────────────────────────

  describe('liquidação deduction override', () => {
    it('overrides existing deduction from liquidação data', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice', deductions: [{ category: 'health', amount: 100 }] })],
      })
      const declFile = makeDeclFile(h, '111222333')
      const liqFile: AssemblyFile = {
        fileName: 'liq.pdf',
        status: 'done',
        nif: '111222333',
        year: 2024,
        parsedLiquidacao: {
          nif: '111222333',
          year: 2024,
          deducoesSaude: 150,
          issues: [],
        } as LiquidacaoParsed,
      }

      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [liqFile],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const alice = result.households[0].members[0]
        const health = alice.deductions.find((d) => d.category === 'health')
        expect(health).toBeDefined()
        // Liquidação deducoesSaude=150, rate=0.15, so expense = 150/0.15 = 1000
        // This overrides the original 100
        expect(health!.amount).toBe(1000)
      }
    })
  })

  // ─── Uncovered Branch Tests ─────────────────────────────────

  describe('nullish coalescing fallbacks in declaration assembly', () => {
    it('falls back to parsedXml.raw NIFs when file nif/nifConjuge are undefined (L160-161)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' }), makePerson({ name: 'Bob' })],
        filing_status: 'married_joint',
      })
      const parsedXml = makeParsedXml(h, '111222333', '444555666')
      const declFile: AssemblyFile = {
        fileName: 'decl.xml',
        status: 'done',
        // nif and nifConjuge intentionally omitted
        year: 2024,
        parsedXml,
      }
      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
        // Single declaration with nifConjuge → spouse stripped, only 1 member
        expect(result.households[0].members).toHaveLength(1)
        expect(result.households[0].members[0].name).toBe('Alice')
        expect(result.households[0].spouse_data_incomplete).toBe(true)
      }
    })
  })

  // ─── Incomplete Spouse Data ────────────────────────────────

  describe('incomplete spouse data (single declaration for married household)', () => {
    it('strips the placeholder spouse member and marks spouse_data_incomplete', () => {
      const h = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            incomes: [{ category: 'A', gross: 40000 }],
          }),
          makePerson({ name: 'Titular B (NIF 987654321)' }),
        ],
        filing_status: 'married_separate',
      })
      const parsedXml = makeParsedXml(h, '123456789', '987654321')
      const declFile: AssemblyFile = {
        fileName: 'decl.xml',
        status: 'done',
        nif: '123456789',
        nifConjuge: '987654321',
        year: 2025,
        parsedXml,
      }
      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const hh = result.households[0]
        expect(hh.spouse_data_incomplete).toBe(true)
        expect(hh.members).toHaveLength(1)
        expect(hh.members[0].name).toBe('Rui')
      }
    })

    it('does not strip spouse when both declarations are provided', () => {
      const h1 = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Rui',
            incomes: [{ category: 'A', gross: 40000 }],
          }),
        ],
        filing_status: 'married_joint',
      })
      const h2 = makeHousehold({
        year: 2025,
        members: [
          makePerson({
            name: 'Micha',
            incomes: [{ category: 'A', gross: 35000 }],
          }),
        ],
        filing_status: 'married_joint',
      })
      const decl1: AssemblyFile = {
        fileName: 'rui.xml',
        status: 'done',
        nif: '123456789',
        nifConjuge: '987654321',
        year: 2025,
        parsedXml: makeParsedXml(h1, '123456789', '987654321'),
      }
      const decl2: AssemblyFile = {
        fileName: 'micha.xml',
        status: 'done',
        nif: '987654321',
        nifConjuge: '123456789',
        year: 2025,
        parsedXml: makeParsedXml(h2, '987654321', '123456789'),
      }
      const sections: AssemblySectionFiles = {
        declaration: [decl1, decl2],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const hh = result.households[0]
        expect(hh.spouse_data_incomplete).toBeUndefined()
        expect(hh.members).toHaveLength(2)
      }
    })

    it('preserves both members from a single joint declaration XML', () => {
      const h = makeHousehold({
        year: 2023,
        members: [
          makePerson({
            name: 'Alice',
            nif: '111222333',
            incomes: [{ category: 'A', gross: 40000 }],
          }),
          makePerson({
            name: 'Bob',
            nif: '444555666',
            incomes: [
              { category: 'A', gross: 30000 },
              { category: 'A', gross: 5000 },
            ],
          }),
        ],
        filing_status: 'married_separate',
        dependents: [{ name: 'Charlie', birth_year: 2018 }],
      })
      const parsedXml = makeParsedXml(h, '111222333', '444555666')
      parsedXml.raw.isJointDeclaration = true
      const declFile: AssemblyFile = {
        fileName: 'joint-decl.xml',
        status: 'done',
        nif: '111222333',
        nifConjuge: '444555666',
        year: 2023,
        parsedXml,
      }
      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const hh = result.households[0]
        // Joint declaration: both members must be preserved
        expect(hh.members).toHaveLength(2)
        expect(hh.members[0].name).toBe('Alice')
        expect(hh.members[1].name).toBe('Bob')
        expect(hh.spouse_data_incomplete).toBeUndefined()
        expect(hh.dependents).toHaveLength(1)
      }
    })

    it('preserves zero-income spouse from joint declaration', () => {
      const h = makeHousehold({
        year: 2023,
        members: [
          makePerson({
            name: 'Alice',
            nif: '111222333',
            incomes: [{ category: 'A', gross: 40000 }],
          }),
          makePerson({
            name: 'Bob',
            nif: '444555666',
            incomes: [],
            deductions: [],
          }),
        ],
        filing_status: 'married_joint',
      })
      const parsedXml = makeParsedXml(h, '111222333', '444555666')
      parsedXml.raw.isJointDeclaration = true
      const declFile: AssemblyFile = {
        fileName: 'joint-decl.xml',
        status: 'done',
        nif: '111222333',
        nifConjuge: '444555666',
        year: 2023,
        parsedXml,
      }
      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const hh = result.households[0]
        // Even zero-income spouse from joint declaration must be preserved
        expect(hh.members).toHaveLength(2)
        expect(hh.members[1].name).toBe('Bob')
        expect(hh.spouse_data_incomplete).toBeUndefined()
      }
    })
  })

  describe('comprovativo and deduction year mismatch', () => {
    it('skips pasted deductions when parsed year does not match household year (L273)', () => {
      const h = makeHousehold({ year: 2024 })
      const nif = '111222333'
      const slot: DeductionSlot = {
        key: `tp-${nif}`,
        nif,
        year: 2023,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          `tp-${nif}`,
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif,
                name: 'Test Person',
                year: 2023, // Mismatched with household year 2024
                expenses: [
                  { category: 'health' as const, expenseAmount: 500, deductionAmount: 75 },
                ],
              },
            },
          },
        ],
      ])
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, nif)],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots: [slot],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Year mismatch → deductions not applied
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })

    it('uses empty string for nif when file nif is undefined in comprovativo path (L169)', () => {
      const comprovativo: ComprovativoParsed = {
        nif: '111222333',
        year: 2024,
        filingStatus: 'single',
        anexoA: [
          {
            titular: 'A',
            rendimentoBruto: 25000,
            retencoesIRS: 4000,
            contribuicoesSS: 2750,
          },
        ],
        issues: [],
      }
      const sections: AssemblySectionFiles = {
        declaration: [
          {
            fileName: 'comp.pdf',
            status: 'done',
            // nif intentionally omitted
            year: 2024,
            parsedComprovativo: comprovativo,
          },
        ],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(1)
        expect(result.issues.some((i) => i.code === 'PDF_FALLBACK')).toBe(true)
      }
    })
  })

  describe('previous years nullish fallbacks', () => {
    it('falls back to parsedXml year when file year is undefined (L233)', () => {
      const primary = makeHousehold({ year: 2024 })
      const prev = makeHousehold({ year: 2023 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(primary)],
        liquidacao: [],
        previousYears: [
          {
            fileName: 'prev.xml',
            status: 'done',
            nif: '111222333',
            // year intentionally omitted — falls back to parsedXml.household.year
            parsedXml: makeParsedXml(prev, '111222333'),
          },
        ],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(2)
        expect(result.households.map((h) => h.year)).toContain(2023)
      }
    })

    it('falls back to parsedXml NIFs when file nif is undefined in previous years (L246)', () => {
      const primary = makeHousehold({ year: 2024 })
      const prev = makeHousehold({ year: 2023 })
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(primary)],
        liquidacao: [],
        previousYears: [
          {
            fileName: 'prev.xml',
            status: 'done',
            // nif intentionally omitted
            year: 2023,
            parsedXml: makeParsedXml(prev, '999888777'),
          },
        ],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.households).toHaveLength(2)
      }
    })
  })

  describe('deduction slot not found', () => {
    it('skips pasted deductions when slot key has no matching slot (L276)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' })],
      })
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          'nonexistent-slot-key',
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif: '111222333',
                name: 'Alice',
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 500, deductionAmount: 75 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111222333')],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        // Empty slots — no match for 'nonexistent-slot-key'
        deductionSlots: [],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Deductions should not have been merged
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })
  })

  describe('liquidação deduction fallback edge cases', () => {
    it('skips fallback when liquidação year does not match household year (L329)', () => {
      const h = makeHousehold({ year: 2024 })
      const liq = {
        year: 2023, // Mismatched year
        nif: '123456789',
        deducoesGerais: 250,
      } as LiquidacaoParsed
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            // No year on AssemblyFile — bypasses validateLiquidacaoFiles year check
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Liq year 2023 !== household year 2024 → no deduction fallback
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })

    it('skips liqByNif when liquidação has no nif (L332)', () => {
      const h = makeHousehold({ year: 2024 })
      const liq: LiquidacaoParsed = {
        year: 2024,
        // nif intentionally omitted
        deducoesGerais: 250,
        issues: [],
      } as LiquidacaoParsed
      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h)],
        liquidacao: [
          {
            fileName: 'liq.pdf',
            status: 'done',
            parsedLiquidacao: liq,
          },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Should still derive deductions via single-liquidação fallback (L344)
        const member = result.households[0].members[0]
        expect(member.deductions.find((d) => d.category === 'general')).toBeDefined()
      }
    })

    it('returns member unchanged when multiple liquidações and no NIF match (L343-344)', () => {
      const nifA = '123456789'
      const nifB = '987654321'
      const hA = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' }), makePerson({ name: 'Bob' })],
        filing_status: 'married_joint',
      })
      const hB = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Bob' })],
        filing_status: 'married_joint',
      })
      const liq1 = {
        year: 2024,
        nif: '999000111', // Doesn't match either declaration nif
        deducoesGerais: 250,
      } as LiquidacaoParsed
      const liq2 = {
        year: 2024,
        nif: '999000222', // Also doesn't match
        deducoesSaude: 300,
      } as LiquidacaoParsed

      const sections: AssemblySectionFiles = {
        declaration: [
          makeDeclFile(hA, nifA, nifB),
          { ...makeDeclFile(hB, nifB, nifA), fileName: 'decl-b.xml' },
        ],
        liquidacao: [
          { fileName: 'liq1.pdf', status: 'done', parsedLiquidacao: liq1 },
          { fileName: 'liq2.pdf', status: 'done', parsedLiquidacao: liq2 },
        ],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        // No NIF match + multiple liquidações → no fallback → no deductions
        for (const member of result.households[0].members) {
          expectOnlyDefaultDeduction(member.deductions)
        }
      }
    })

    it('uses nifConjuge for second member in liquidação fallback (L339)', () => {
      const nifA = '111222333'
      const nifB = '444555666'
      const hA = makeHousehold({
        year: 2024,
        filing_status: 'married_joint',
        members: [makePerson({ name: 'Alice' }), makePerson({ name: 'Bob' })],
      })
      const hB = makeHousehold({
        year: 2024,
        filing_status: 'married_joint',
        members: [makePerson({ name: 'Bob' })],
      })
      const liqB = {
        year: 2024,
        nif: nifB,
        deducoesGerais: 350,
      } as LiquidacaoParsed

      const sections: AssemblySectionFiles = {
        declaration: [
          makeDeclFile(hA, nifA, nifB),
          { ...makeDeclFile(hB, nifB, nifA), fileName: 'decl-b.xml' },
        ],
        liquidacao: [{ fileName: 'liq.pdf', status: 'done', parsedLiquidacao: liqB }],
        previousYears: [],
      }
      const result = assembleHouseholds(baseInput(sections))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const bob = result.households[0].members[1]
        // nifB matched via declFile.nifConjuge → deductions derived from liqB
        expect(bob.deductions.find((d) => d.category === 'general')).toBeDefined()
      }
    })
  })

  describe('taxpayer deduction NIF fallback matching', () => {
    it('matches member by NIF when name does not match (L281-293)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice Real Name' })],
      })
      const nif = '111222333'
      const declFile = makeDeclFile(h, nif)
      const slot: DeductionSlot = {
        key: `tp-${nif}`,
        nif,
        year: 2024,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          `tp-${nif}`,
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif,
                name: 'Different Name From AT', // Name does NOT match member
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 800, deductionAmount: 120 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots: [slot],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // Should still match via NIF fallback (isSubjectA path)
        const alice = result.households[0].members[0]
        expect(alice.deductions.some((d) => d.category === 'health' && d.amount === 800)).toBe(true)
      }
    })

    it('skips zero-amount expenses in taxpayer pasted deductions (L300)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' })],
      })
      const nif = '111222333'
      const declFile = makeDeclFile(h, nif)
      const slot: DeductionSlot = {
        key: `tp-${nif}`,
        nif,
        year: 2024,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          `tp-${nif}`,
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif,
                name: 'Alice',
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 0, deductionAmount: 0 },
                  { category: 'education' as const, expenseAmount: 400, deductionAmount: 120 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots: [slot],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        const alice = result.households[0].members[0]
        // Only education (400) added; health (0) skipped via L300 check; default general also added
        expect(alice.deductions).toHaveLength(2)
        expect(alice.deductions.find((d) => d.category === 'education')?.amount).toBe(400)
        expect(alice.deductions.find((d) => d.category === 'general')?.amount).toBe(
          DEFAULT_GENERAL_DEDUCTION_AMOUNT,
        )
      }
    })

    it('does not match member when no declaration file has matching NIF (L285)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' })],
      })
      const declFile = makeDeclFile(h, '111222333')
      const slot: DeductionSlot = {
        key: 'tp-999999999',
        nif: '999999999',
        year: 2024,
        role: 'taxpayer',
        hasLiquidacao: false,
      }
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          'tp-999999999',
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif: '999999999', // No declaration file has this NIF
                name: 'Unknown Person',
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 500, deductionAmount: 75 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [declFile],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots: [slot],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // No member matched → deductions not applied
        expectOnlyDefaultDeduction(result.households[0].members[0].deductions)
      }
    })
  })

  describe('dependent deduction zero-amount filtering', () => {
    it('skips zero-amount expenses in dependent deductions (L312)', () => {
      const h = makeHousehold({
        year: 2024,
        members: [makePerson({ name: 'Alice' })],
      })
      const slot: DeductionSlot = {
        key: 'dep-child',
        nif: '000111222',
        year: 2024,
        role: 'dependent',
        hasLiquidacao: false,
      }
      const pastedDeductions = new Map<string, { text: string; result: DeductionsParseResult }>([
        [
          'dep-child',
          {
            text: 'pasted',
            result: {
              ok: true,
              data: {
                nif: '000111222',
                name: 'Child',
                year: 2024,
                expenses: [
                  { category: 'health' as const, expenseAmount: 0, deductionAmount: 0 },
                  { category: 'education' as const, expenseAmount: 200, deductionAmount: 60 },
                ],
              },
            },
          },
        ],
      ])

      const sections: AssemblySectionFiles = {
        declaration: [makeDeclFile(h, '111222333')],
        liquidacao: [],
        previousYears: [],
      }
      const result = assembleHouseholds({
        sectionFiles: sections,
        pastedDeductions,
        deductionSlots: [slot],
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        const alice = result.households[0].members[0]
        // Only education (200) should be added, health (0) should be skipped; default general also added
        expect(alice.deductions).toHaveLength(2)
        expect(alice.deductions.find((d) => d.category === 'education')?.amount).toBe(200)
        expect(alice.deductions.find((d) => d.category === 'general')?.amount).toBe(
          DEFAULT_GENERAL_DEDUCTION_AMOUNT,
        )
      }
    })
  })
})
