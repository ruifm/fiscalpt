import { describe, it, expect } from 'vitest'
import { assembleHouseholds, type AssemblyInput } from '@/lib/tax/assemble-households'
import type { ComprovativoParsed } from '@/lib/tax/pdf-extractor'

function makeComprovativo(overrides: Partial<ComprovativoParsed> = {}): ComprovativoParsed {
  return {
    nif: '111111111',
    year: 2024,
    filingStatus: 'married_joint',
    dependentNifs: [],
    issues: [],
    ...overrides,
  }
}

function makeInput(overrides: Partial<AssemblyInput['sectionFiles']> = {}): AssemblyInput {
  return {
    sectionFiles: {
      declaration: [],
      liquidacao: [],
      previousYears: [],
      ...overrides,
    },
    pastedDeductions: new Map(),
    deductionSlots: [],
  }
}

describe('assembleHouseholds — PDF comprovativo support', () => {
  it('returns NEED_DECLARATION when no files', () => {
    const result = assembleHouseholds(makeInput())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('NEED_DECLARATION')
  })

  it('assembles single comprovativo into household', () => {
    const parsed = makeComprovativo({
      nif: '111111111',
      year: 2024,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 30000, retencoesIRS: 5000, contribuicoesSS: 3300 }],
    })

    const result = assembleHouseholds(
      makeInput({
        declaration: [
          {
            fileName: 'comprov.pdf',
            status: 'done',
            nif: '111111111',
            year: 2024,
            parsedComprovativo: parsed,
          },
        ],
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.households.length).toBeGreaterThanOrEqual(1)
    const h = result.households[0]
    expect(h.year).toBe(2024)
    expect(h.members[0].incomes.length).toBeGreaterThan(0)
    expect(h.members[0].incomes[0].category).toBe('A')
    expect(h.members[0].incomes[0].gross).toBe(30000)
  })

  it('merges two spouse comprovativos into one household', () => {
    const parsedA = makeComprovativo({
      nif: '111111111',
      nifConjuge: '222222222',
      year: 2024,
      filingStatus: 'married_joint',
      anexoB: [{ titular: 'A', nif: '111111111', somaRendimentos: 50000 }],
    })

    const parsedB = makeComprovativo({
      nif: '222222222',
      nifConjuge: '111111111',
      year: 2024,
      filingStatus: 'married_joint',
      anexoA: [{ titular: 'A', rendimentoBruto: 25000, retencoesIRS: 5000, contribuicoesSS: 2750 }],
    })

    const result = assembleHouseholds(
      makeInput({
        declaration: [
          {
            fileName: 'comprov_a.pdf',
            status: 'done',
            nif: '111111111',
            nifConjuge: '222222222',
            year: 2024,
            parsedComprovativo: parsedA,
          },
          {
            fileName: 'comprov_b.pdf',
            status: 'done',
            nif: '222222222',
            nifConjuge: '111111111',
            year: 2024,
            parsedComprovativo: parsedB,
          },
        ],
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const h = result.households[0]
    expect(h.filing_status).toBe('married_joint')
    expect(h.members).toHaveLength(2)

    // Holder A has Cat B income
    const memberA = h.members.find((m) => m.incomes.some((i) => i.category === 'B'))
    expect(memberA).toBeDefined()
    expect(memberA!.incomes.find((i) => i.category === 'B')?.gross).toBe(50000)

    // Holder B has Cat A income
    const memberB = h.members.find((m) => m.incomes.some((i) => i.category === 'A'))
    expect(memberB).toBeDefined()
    expect(memberB!.incomes.find((i) => i.category === 'A')?.gross).toBe(25000)
  })

  it('uses PDF comprovativos for previous years when no XML', () => {
    // Primary declaration as XML (minimal stub via comprovativo)
    const primaryParsed = makeComprovativo({
      nif: '111111111',
      year: 2024,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 30000, retencoesIRS: 5000, contribuicoesSS: 3300 }],
    })

    // Previous year as PDF comprovativo
    const prevParsed = makeComprovativo({
      nif: '111111111',
      year: 2023,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 28000, retencoesIRS: 4500, contribuicoesSS: 3080 }],
    })

    const result = assembleHouseholds(
      makeInput({
        declaration: [
          {
            fileName: 'primary.pdf',
            status: 'done',
            nif: '111111111',
            year: 2024,
            parsedComprovativo: primaryParsed,
          },
        ],
        previousYears: [
          {
            fileName: 'prev_2023.pdf',
            status: 'done',
            nif: '111111111',
            year: 2023,
            parsedComprovativo: prevParsed,
          },
        ],
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Should have primary + previous year households
    expect(result.households.length).toBe(2)
    const prevH = result.households.find((h) => h.year === 2023)
    expect(prevH).toBeDefined()
    expect(prevH!.members[0].incomes[0].gross).toBe(28000)

    // Should contain PDF_FALLBACK issue
    expect(result.issues.some((i) => i.code === 'PDF_FALLBACK')).toBe(true)
  })

  it('prefers XML over PDF for previous years of the same year', () => {
    const primaryParsed = makeComprovativo({
      nif: '111111111',
      year: 2024,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 30000, retencoesIRS: 5000, contribuicoesSS: 3300 }],
    })

    const prevPdfParsed = makeComprovativo({
      nif: '111111111',
      year: 2023,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 99999, retencoesIRS: 9999, contribuicoesSS: 9999 }],
    })

    const result = assembleHouseholds(
      makeInput({
        declaration: [
          {
            fileName: 'primary.pdf',
            status: 'done',
            nif: '111111111',
            year: 2024,
            parsedComprovativo: primaryParsed,
          },
        ],
        previousYears: [
          {
            // XML version — should be preferred
            fileName: 'prev_2023.xml',
            status: 'done',
            nif: '111111111',
            year: 2023,
            parsedXml: {
              household: {
                year: 2023,
                filing_status: 'single',
                members: [
                  {
                    name: 'Contribuinte A',
                    incomes: [{ category: 'A' as const, gross: 28000, withholding: 4500 }],
                    deductions: [],
                    special_regimes: [],
                  },
                ],
                dependents: [],
              },
              raw: {
                subjectA_nif: '111111111',
                subjectB_nif: '',
              },
              issues: [],
            } as never,
          },
          {
            // PDF version — should be skipped (XML already covers 2023)
            fileName: 'prev_2023.pdf',
            status: 'done',
            nif: '111111111',
            year: 2023,
            parsedComprovativo: prevPdfParsed,
          },
        ],
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const prevH = result.households.find((h) => h.year === 2023)
    expect(prevH).toBeDefined()
    // Should use XML value (28000), not PDF value (99999)
    expect(prevH!.members[0].incomes[0].gross).toBe(28000)
  })

  it('does not duplicate PDF comprovativo year when same as primary declaration', () => {
    const primaryParsed = makeComprovativo({
      nif: '111111111',
      year: 2024,
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 30000, retencoesIRS: 5000, contribuicoesSS: 3300 }],
    })

    const prevParsed = makeComprovativo({
      nif: '111111111',
      year: 2024, // same as primary — should be skipped
      filingStatus: 'single',
      anexoA: [{ titular: 'A', rendimentoBruto: 99999, retencoesIRS: 9999, contribuicoesSS: 9999 }],
    })

    const result = assembleHouseholds(
      makeInput({
        declaration: [
          {
            fileName: 'primary.pdf',
            status: 'done',
            nif: '111111111',
            year: 2024,
            parsedComprovativo: primaryParsed,
          },
        ],
        previousYears: [
          {
            fileName: 'prev_dupe.pdf',
            status: 'done',
            nif: '111111111',
            year: 2024,
            parsedComprovativo: prevParsed,
          },
        ],
      }),
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    // Only one household — the primary
    expect(result.households.length).toBe(1)
    expect(result.households[0].year).toBe(2024)
    expect(result.households[0].members[0].incomes[0].gross).toBe(30000)
  })
})
