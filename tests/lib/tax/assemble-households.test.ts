import { describe, it, expect } from 'vitest'
import {
  assembleHouseholds,
  LIQUIDACAO_DEDUCTION_MAP,
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
        expect(result.households[0].members[0].deductions).toHaveLength(0)
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
        expect(result.households[0].members[0].deductions).toHaveLength(0)
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
        expect(result.households[0].members[0].deductions).toHaveLength(0)
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
})
