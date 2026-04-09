/**
 * PDF ↔ XML Extraction Parity Tests
 *
 * For each year (2021-2024) and holder (A, B), parse the same declaration
 * from both the XML Modelo 3 and the comprovativo PDF, then assert that
 * the extracted household data matches.
 *
 * This catches regressions in the PDF parser without needing full E2E tests.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import { JSDOM } from 'jsdom'
import { parseModelo3Xml } from '@/lib/tax/xml-parser'
import { parseComprovativoPdfText, comprativoParsedToHousehold } from '@/lib/tax/pdf-extractor'
import type { Household, Person, Income } from '@/lib/tax/types'

// DOMParser polyfill for Node.js (xml-parser uses browser DOMParser)
beforeAll(() => {
  const dom = new JSDOM('')
  globalThis.DOMParser = dom.window.DOMParser
})

// ─── Node-compatible PDF text extraction ─────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────

const FIXTURES = path.resolve(__dirname, '../fixtures/e2e')

function xmlPath(year: number, holder: 'a' | 'b'): string {
  return path.join(FIXTURES, `decl-m3-irs-${year}-holder-${holder}.xml`)
}

function pdfPath(year: number, holder: 'a' | 'b'): string {
  return path.join(FIXTURES, `comprovativo-${year}-holder-${holder}.pdf`)
}

function parseXml(year: number, holder: 'a' | 'b'): Household {
  const xml = fs.readFileSync(xmlPath(year, holder), 'utf-8')
  return parseModelo3Xml(xml).household
}

async function parsePdf(year: number, holder: 'a' | 'b'): Promise<Household> {
  const text = await extractTextFromPdfNode(pdfPath(year, holder))
  const parsed = parseComprovativoPdfText(text)
  const { household } = comprativoParsedToHousehold(parsed)
  return household as Household
}

/** Get incomes for a specific category from a person */
function incomesByCategory(person: Person, cat: Income['category']): Income[] {
  return person.incomes.filter((i) => i.category === cat)
}

/**
 * Get DOMESTIC incomes for a category (excludes foreign/Anexo J entries).
 * The XML parser has a known bug where Anexo J foreign income is silently
 * skipped (wrong element names in ANEXO_J_TABLES). The PDF parser correctly
 * extracts it. To compare parity, we must filter to domestic-only.
 */
function domesticIncomesByCategory(person: Person, cat: Income['category']): Income[] {
  return person.incomes.filter((i) => i.category === cat && !i.country_code)
}

/** Sum gross income for a category */
function grossByCategory(person: Person, cat: Income['category']): number {
  return incomesByCategory(person, cat).reduce((sum, i) => sum + i.gross, 0)
}

/** Sum gross DOMESTIC income for a category */
function domesticGrossByCategory(person: Person, cat: Income['category']): number {
  return domesticIncomesByCategory(person, cat).reduce((sum, i) => sum + i.gross, 0)
}

// ─── Test matrix ─────────────────────────────────────────────

interface FixturePair {
  year: number
  holder: 'a' | 'b'
  label: string
  // Expected data for cross-checks
  expectedDependents: number
  holderHasCatA: boolean
  holderHasCatB: boolean
  holderHasNhr: boolean
}

const PAIRS: FixturePair[] = [
  // 2021: no dependents, holder A = Cat A only, holder B = Cat A + NHR
  {
    year: 2021,
    holder: 'a',
    label: 'Holder A 2021',
    expectedDependents: 0,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: false,
  },
  {
    year: 2021,
    holder: 'b',
    label: 'Holder B 2021',
    expectedDependents: 0,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: true,
  },
  // 2022: 1 dependent, holder A = Cat A, holder B = Cat A + NHR
  {
    year: 2022,
    holder: 'a',
    label: 'Holder A 2022',
    expectedDependents: 1,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: false,
  },
  {
    year: 2022,
    holder: 'b',
    label: 'Holder B 2022',
    expectedDependents: 1,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: true,
  },
  // 2023: holder A = Cat A + Cat B (transition year), holder B = Cat A + NHR
  {
    year: 2023,
    holder: 'a',
    label: 'Holder A 2023',
    expectedDependents: 1,
    holderHasCatA: true,
    holderHasCatB: true,
    holderHasNhr: false,
  },
  {
    year: 2023,
    holder: 'b',
    label: 'Holder B 2023',
    expectedDependents: 0,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: true,
  },
  // 2024: 2 dependents, holder A = Cat B only, holder B = Cat A + NHR
  {
    year: 2024,
    holder: 'a',
    label: 'Holder A 2024',
    expectedDependents: 2,
    holderHasCatA: false,
    holderHasCatB: true,
    holderHasNhr: false,
  },
  {
    year: 2024,
    holder: 'b',
    label: 'Holder B 2024',
    expectedDependents: 2,
    holderHasCatA: true,
    holderHasCatB: false,
    holderHasNhr: true,
  },
]

// ─── Tests ───────────────────────────────────────────────────

describe('PDF ↔ XML extraction parity', () => {
  for (const pair of PAIRS) {
    describe(pair.label, () => {
      let xmlHousehold: Household
      let pdfHousehold: Household

      beforeAll(async () => {
        xmlHousehold = parseXml(pair.year, pair.holder)
        pdfHousehold = await parsePdf(pair.year, pair.holder)
      }, 30_000)

      it('extracts same year', () => {
        expect(pdfHousehold.year).toBe(xmlHousehold.year)
        expect(pdfHousehold.year).toBe(pair.year)
      })

      it('extracts same filing status', () => {
        // Both should detect married status from spouse NIF presence
        const xmlMarried = xmlHousehold.filing_status !== 'single'
        const pdfMarried = pdfHousehold.filing_status !== 'single'
        expect(pdfMarried).toBe(xmlMarried)
      })

      it('extracts same number of dependents', () => {
        expect(pdfHousehold.dependents.length).toBe(xmlHousehold.dependents.length)
        expect(pdfHousehold.dependents.length).toBe(pair.expectedDependents)
      })

      it('creates same number of members', () => {
        expect(pdfHousehold.members.length).toBe(xmlHousehold.members.length)
      })

      // Income parity for the declaration holder (member[0])
      // Use domestic-only helpers: XML Anexo J parser is broken (wrong element
      // names) so it silently skips foreign income. PDF parser extracts it
      // correctly. Comparing domestic-only ensures true parity.
      describe('holder income (member[0])', () => {
        if (pair.holderHasCatA) {
          it('matches Cat A gross income (domestic only)', () => {
            const xmlGross = domesticGrossByCategory(xmlHousehold.members[0], 'A')
            const pdfGross = domesticGrossByCategory(pdfHousehold.members[0], 'A')
            expect(pdfGross).toBeCloseTo(xmlGross, 0)
            expect(pdfGross).toBeGreaterThan(0)
          })

          it('matches Cat A withholding (domestic only)', () => {
            const xmlWh = domesticIncomesByCategory(xmlHousehold.members[0], 'A').reduce(
              (s, i) => s + (i.withholding ?? 0),
              0,
            )
            const pdfWh = domesticIncomesByCategory(pdfHousehold.members[0], 'A').reduce(
              (s, i) => s + (i.withholding ?? 0),
              0,
            )
            expect(pdfWh).toBeCloseTo(xmlWh, 0)
          })

          it('matches Cat A SS contributions (domestic only)', () => {
            const xmlSs = domesticIncomesByCategory(xmlHousehold.members[0], 'A').reduce(
              (s, i) => s + (i.ss_paid ?? 0),
              0,
            )
            const pdfSs = domesticIncomesByCategory(pdfHousehold.members[0], 'A').reduce(
              (s, i) => s + (i.ss_paid ?? 0),
              0,
            )
            expect(pdfSs).toBeCloseTo(xmlSs, 0)
          })
        }

        if (pair.holderHasCatB) {
          it('matches Cat B gross income', () => {
            const xmlGross = grossByCategory(xmlHousehold.members[0], 'B')
            const pdfGross = grossByCategory(pdfHousehold.members[0], 'B')
            expect(pdfGross).toBeCloseTo(xmlGross, 0)
            expect(pdfGross).toBeGreaterThan(0)
          })
        }

        if (!pair.holderHasCatA && !pair.holderHasCatB) {
          it('has no income (same as XML)', () => {
            expect(pdfHousehold.members[0].incomes.length).toBe(
              xmlHousehold.members[0].incomes.length,
            )
          })
        }
      })

      // Special regimes
      describe('special regimes', () => {
        it('detects NHR consistently', () => {
          const xmlNhr = xmlHousehold.members[0].special_regimes.includes('nhr')
          const pdfNhr = pdfHousehold.members[0].special_regimes.includes('nhr')
          expect(pdfNhr).toBe(xmlNhr)
          if (pair.holderHasNhr) {
            expect(pdfNhr).toBe(true)
          }
        })

        it('detects NHR confirmed flag consistently', () => {
          const xmlConfirmed = xmlHousehold.members[0].nhr_confirmed === true
          const pdfConfirmed = pdfHousehold.members[0].nhr_confirmed === true
          expect(pdfConfirmed).toBe(xmlConfirmed)
        })
      })

      // Spouse placeholder (member[1] if married)
      it('has consistent spouse presence', () => {
        const xmlHasSpouse = xmlHousehold.members.length >= 2
        const pdfHasSpouse = pdfHousehold.members.length >= 2
        expect(pdfHasSpouse).toBe(xmlHasSpouse)
      })
    })
  }
})

// ─── Detailed 2024 cross-checks ─────────────────────────────
// These verify exact amounts for the most recent year where we have
// the most confidence in the expected values.

describe('PDF ↔ XML 2024 detailed parity', () => {
  let xmlA: Household
  let pdfA: Household
  let xmlB: Household
  let pdfB: Household

  beforeAll(async () => {
    xmlA = parseXml(2024, 'a')
    pdfA = await parsePdf(2024, 'a')
    xmlB = parseXml(2024, 'b')
    pdfB = await parsePdf(2024, 'b')
  }, 30_000)

  describe('Holder A — Cat B self-employed', () => {
    it('PDF extracts Cat B gross = €52,329.20 (same as XML)', () => {
      const xmlGross = grossByCategory(xmlA.members[0], 'B')
      const pdfGross = grossByCategory(pdfA.members[0], 'B')
      expect(xmlGross).toBeCloseTo(52329.2, 1)
      expect(pdfGross).toBeCloseTo(52329.2, 1)
    })

    it('PDF has no Cat A income (same as XML)', () => {
      expect(incomesByCategory(xmlA.members[0], 'A')).toHaveLength(0)
      expect(incomesByCategory(pdfA.members[0], 'A')).toHaveLength(0)
    })

    it('Holder A is not NHR', () => {
      expect(xmlA.members[0].special_regimes).not.toContain('nhr')
      expect(pdfA.members[0].special_regimes).not.toContain('nhr')
    })
  })

  describe('Holder B — Cat A employed + NHR', () => {
    it('PDF extracts Cat A gross = €24,285.92 (same as XML)', () => {
      const xmlGross = grossByCategory(xmlB.members[0], 'A')
      const pdfGross = grossByCategory(pdfB.members[0], 'A')
      expect(xmlGross).toBeCloseTo(24285.92, 1)
      expect(pdfGross).toBeCloseTo(24285.92, 1)
    })

    it('PDF extracts Cat A withholding = €4,926.15 (same as XML)', () => {
      const xmlWh = incomesByCategory(xmlB.members[0], 'A').reduce(
        (s, i) => s + (i.withholding ?? 0),
        0,
      )
      const pdfWh = incomesByCategory(pdfB.members[0], 'A').reduce(
        (s, i) => s + (i.withholding ?? 0),
        0,
      )
      expect(xmlWh).toBeCloseTo(4926.15, 1)
      expect(pdfWh).toBeCloseTo(4926.15, 1)
    })

    it('PDF extracts Cat A SS = €3,146.68 (same as XML)', () => {
      const xmlSs = incomesByCategory(xmlB.members[0], 'A').reduce(
        (s, i) => s + (i.ss_paid ?? 0),
        0,
      )
      const pdfSs = incomesByCategory(pdfB.members[0], 'A').reduce(
        (s, i) => s + (i.ss_paid ?? 0),
        0,
      )
      expect(xmlSs).toBeCloseTo(3146.68, 1)
      expect(pdfSs).toBeCloseTo(3146.68, 1)
    })

    it('PDF extracts union dues (same as XML)', () => {
      // XML stores union dues as a sindical deduction
      const xmlUnion = xmlB.members[0].deductions
        .filter((d) => d.category === 'sindical')
        .reduce((s, d) => s + d.amount, 0)
      // PDF may store as union_dues on the income or as sindical deduction
      const pdfUnionOnIncome = incomesByCategory(pdfB.members[0], 'A').reduce(
        (s, i) => s + (i.union_dues ?? 0),
        0,
      )
      const pdfUnionDeduction = pdfB.members[0].deductions
        .filter((d) => d.category === 'sindical')
        .reduce((s, d) => s + d.amount, 0)
      const pdfUnion = pdfUnionOnIncome + pdfUnionDeduction

      // At least one path should have the union dues
      if (xmlUnion > 0) {
        expect(pdfUnion).toBeCloseTo(xmlUnion, 0)
      }
    })

    it('PDF detects NHR (same as XML)', () => {
      expect(xmlB.members[0].special_regimes).toContain('nhr')
      expect(pdfB.members[0].special_regimes).toContain('nhr')
    })

    it('PDF has no Cat B income (same as XML)', () => {
      expect(incomesByCategory(xmlB.members[0], 'B')).toHaveLength(0)
      expect(incomesByCategory(pdfB.members[0], 'B')).toHaveLength(0)
    })
  })

  describe('household structure', () => {
    it('both holders show 2 dependents for 2024', () => {
      expect(xmlA.dependents).toHaveLength(2)
      expect(pdfA.dependents).toHaveLength(2)
      expect(xmlB.dependents).toHaveLength(2)
      expect(pdfB.dependents).toHaveLength(2)
    })

    it('both holders detect married status', () => {
      expect(xmlA.filing_status).not.toBe('single')
      expect(pdfA.filing_status).not.toBe('single')
      expect(xmlB.filing_status).not.toBe('single')
      expect(pdfB.filing_status).not.toBe('single')
    })

    it('both holders create 2 members (holder + spouse placeholder)', () => {
      expect(xmlA.members).toHaveLength(2)
      expect(pdfA.members).toHaveLength(2)
      expect(xmlB.members).toHaveLength(2)
      expect(pdfB.members).toHaveLength(2)
    })
  })
})
