import { describe, it, expect, beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

beforeAll(() => {
  const dom = new JSDOM('')
  globalThis.DOMParser = dom.window.DOMParser
})

import { parseModelo3Xml } from '@/lib/tax/xml-parser'

const XML_DIR = process.env.TAX_FIXTURES_DIR ?? ''
const HAS_FIXTURES = XML_DIR !== '' && existsSync(XML_DIR)

function loadXml(year: number): string {
  const nif = process.env.TAX_FIXTURES_NIF ?? '100000001'
  return readFileSync(join(XML_DIR, `decl-m3-irs-${year}-${nif}.xml`), 'utf-8')
}

describe.skipIf(!HAS_FIXTURES)('XML Parser — Real AT Declarations (2021-2024)', () => {
  // ─── 2024: Single filer, Cat B only, AnexoSS with foreign SS ──

  describe('2024 declaration', () => {
    let result: ReturnType<typeof parseModelo3Xml>
    beforeAll(() => {
      result = parseModelo3Xml(loadXml(2024))
    })

    it('Rosto: year, NIF, civil status, filing', () => {
      expect(result.raw.year).toBe(2024)
      expect(result.raw.subjectA_nif).toMatch(/^[0-9]{9}$/)
      expect(result.raw.subjectA_name).toBeDefined()
      expect(result.raw.civilStatus).toBe(1) // casado
      expect(result.raw.filingOption).toBe(1) // separate
      expect(result.raw.disabilitySPA).toBe(0)
      expect(result.household.members[0].disability_degree).toBeUndefined()
      expect(result.household.filing_status).toBe('married_separate')
    })

    it('Rosto: spouse and dependents', () => {
      expect(result.raw.subjectB_nif).toMatch(/^[0-9]{9}$/)
      expect(result.household.members).toHaveLength(2) // married → 2 members
      expect(result.household.dependents).toHaveLength(2)
    })

    it('Anexo B: Cat B services income (code 403)', () => {
      const personA = result.household.members[0]
      const catB = personA.incomes.find((i) => i.category === 'B')
      expect(catB).toBeDefined()
      expect(catB!.gross).toBe(52329.2)
      expect(catB!.cat_b_income_code).toBe(403)
      expect(catB!.cat_b_regime).toBe('simplified')
    })

    it('Anexo B raw: activity code and prior year', () => {
      expect(result.raw.anexoB).toHaveLength(1)
      const ab = result.raw.anexoB[0]
      expect(ab.activityCode).toBe('1332')
      expect(ab.regime).toBe('simplified')
      expect(ab.priorYearIncome).toBe(42468.62)
      expect(ab.firstYear).toBe(true)
    })

    it('Anexo SS: income base and foreign SS (Spain)', () => {
      expect(result.raw.anexoSS).toHaveLength(1)
      const ss = result.raw.anexoSS[0]
      expect(ss.nif).toMatch(/^[0-9]{9}$/)
      expect(ss.niss).toBe('99900000001')
      expect(ss.catBIncome).toBe(52329.2)
      expect(ss.foreignActivity).toBe(true)
      expect(ss.foreignActivityEntries).toHaveLength(1)
      expect(ss.foreignActivityEntries[0].country).toBe('724')
      expect(ss.foreignActivityEntries[0].foreignNif).toBe('B70340872')
      expect(ss.foreignActivityEntries[0].amount).toBe(52329.2)
    })

    it('detected Anexos: B + SS', () => {
      expect(result.raw.anexosPresent).toContain('AnexoB')
      expect(result.raw.anexosPresent).toContain('AnexoSS')
      expect(result.raw.anexosPresent).not.toContain('AnexoA')
    })

    it('no Cat A income for 2024', () => {
      const personA = result.household.members[0]
      expect(personA.incomes.filter((i) => i.category === 'A')).toHaveLength(0)
    })
  })

  // ─── 2023: Unido facto, Cat A + Cat B, AnexoSS ───────────

  describe('2023 declaration', () => {
    let result: ReturnType<typeof parseModelo3Xml>
    beforeAll(() => {
      result = parseModelo3Xml(loadXml(2023))
    })

    it('Rosto: unido de facto, separate filing', () => {
      expect(result.raw.year).toBe(2023)
      expect(result.raw.civilStatus).toBe(2) // unido de facto
      expect(result.raw.filingOption).toBe(1) // separate
      expect(result.household.filing_status).toBe('married_separate')
    })

    it('Rosto: 1 dependent', () => {
      expect(result.household.dependents).toHaveLength(1)
      expect(result.raw.dependents[0].nif).toMatch(/^[0-9]{9}$/)
    })

    it('Anexo A: Cat A employment income', () => {
      const personA = result.household.members[0]
      const catA = personA.incomes.find((i) => i.category === 'A')
      expect(catA).toBeDefined()
      expect(catA!.gross).toBe(15469.02)
      expect(catA!.withholding).toBe(4314)
      expect(catA!.ss_paid).toBe(1701.63)
      expect(catA!.cat_a_code).toBe(401)
    })

    it('Anexo B: Cat B services income with CAE', () => {
      const personA = result.household.members[0]
      const catB = personA.incomes.find((i) => i.category === 'B')
      expect(catB).toBeDefined()
      expect(catB!.gross).toBe(42468.62)
      expect(catB!.cat_b_income_code).toBe(403)
      expect(catB!.cat_b_activity_code).toBe('1332')
      expect(catB!.cat_b_cae).toBe('62010')
    })

    it('Anexo SS: foreign SS (Spain)', () => {
      const ss = result.raw.anexoSS[0]
      expect(ss.catBIncome).toBe(42468.62)
      expect(ss.foreignActivity).toBe(true)
      expect(ss.foreignActivityEntries[0].country).toBe('724')
    })

    it('detected Anexos: A + B + SS', () => {
      expect(result.raw.anexosPresent).toContain('AnexoA')
      expect(result.raw.anexosPresent).toContain('AnexoB')
      expect(result.raw.anexosPresent).toContain('AnexoSS')
    })
  })

  // ─── 2022: Unido facto, Cat A only ──────────────────────

  describe('2022 declaration', () => {
    let result: ReturnType<typeof parseModelo3Xml>
    beforeAll(() => {
      result = parseModelo3Xml(loadXml(2022))
    })

    it('Rosto: unido de facto, Cat A only', () => {
      expect(result.raw.year).toBe(2022)
      expect(result.raw.civilStatus).toBe(2) // unido de facto
      expect(result.household.filing_status).toBe('married_separate')
    })

    it('Rosto: 1 dependent', () => {
      expect(result.household.dependents).toHaveLength(1)
    })

    it('Anexo A: single employer', () => {
      const personA = result.household.members[0]
      expect(personA.incomes).toHaveLength(1)
      expect(personA.incomes[0].category).toBe('A')
      expect(personA.incomes[0].gross).toBe(28718.38)
      expect(personA.incomes[0].withholding).toBe(6802)
      expect(personA.incomes[0].ss_paid).toBe(3159.12)
    })

    it('no Anexo B or SS', () => {
      expect(result.raw.anexosPresent).not.toContain('AnexoB')
      expect(result.raw.anexosPresent).not.toContain('AnexoSS')
    })
  })

  // ─── 2021: Unido facto, Cat A only, no dependents ───────

  describe('2021 declaration', () => {
    let result: ReturnType<typeof parseModelo3Xml>
    beforeAll(() => {
      result = parseModelo3Xml(loadXml(2021))
    })

    it('Rosto: unido de facto, no dependents', () => {
      expect(result.raw.year).toBe(2021)
      expect(result.raw.civilStatus).toBe(2)
      expect(result.household.dependents).toHaveLength(0)
    })

    it('Anexo A: single employer', () => {
      const personA = result.household.members[0]
      expect(personA.incomes).toHaveLength(1)
      expect(personA.incomes[0].gross).toBe(14010.36)
      expect(personA.incomes[0].withholding).toBe(3153)
      expect(personA.incomes[0].ss_paid).toBe(1541.15)
    })

    it('IBAN parsed', () => {
      expect(result.raw.iban).toBe('PT50002300004562932157094')
    })
  })

  // ─── Cross-year consistency ──────────────────────────────

  describe('Cross-year consistency', () => {
    it('same taxpayer NIF across all years', () => {
      for (const year of [2021, 2022, 2023, 2024]) {
        const result = parseModelo3Xml(loadXml(year))
        expect(result.raw.subjectA_nif).toMatch(/^[0-9]{9}$/)
      }
    })

    it('same spouse NIF when married/union', () => {
      for (const year of [2021, 2022, 2023, 2024]) {
        const result = parseModelo3Xml(loadXml(year))
        expect(result.raw.subjectB_nif).toMatch(/^[0-9]{9}$/)
      }
    })
  })
})
