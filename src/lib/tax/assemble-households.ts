import type { Household, ValidationIssue, DeductionCategory } from '@/lib/tax/types'
import type { ParsedXmlResult } from '@/lib/tax/xml-parser'
import type { ComprovativoParsed, LiquidacaoParsed, DocumentType } from '@/lib/tax/pdf-extractor'
import { comprativoParsedToHousehold } from '@/lib/tax/pdf-extractor'
import type { DeductionSlot, FileInfo } from '@/lib/tax/upload-validation'
import {
  validateDeclarationFiles,
  validateLiquidacaoFiles,
  validatePreviousYearsFiles,
  validateCrossSection,
  mergeSpouseHouseholds,
} from '@/lib/tax/upload-validation'
import type { DeductionsParseResult } from '@/lib/tax/deductions-parser'

// ─── Types ──────────────────────────────────────────────────

/** Lightweight file representation for assembly (no File/Blob dependency) */
export interface AssemblyFile {
  fileName: string
  status: 'pending' | 'processing' | 'done' | 'error'
  nif?: string
  year?: number
  nifConjuge?: string
  parsedXml?: ParsedXmlResult
  parsedComprovativo?: ComprovativoParsed
  parsedLiquidacao?: LiquidacaoParsed
}

export interface AssemblySectionFiles {
  declaration: AssemblyFile[]
  liquidacao: AssemblyFile[]
  previousYears: AssemblyFile[]
}

export interface AssemblyInput {
  sectionFiles: AssemblySectionFiles
  pastedDeductions: Map<string, { text: string; result: DeductionsParseResult }>
  /** Deduction slots for role lookup during deduction merging */
  deductionSlots: DeductionSlot[]
}

/** Error codes returned by assembleHouseholds (caller translates to UI strings) */
export type AssemblyErrorCode =
  | 'NEED_DECLARATION'
  | 'STILL_PROCESSING'
  | 'VALIDATION_FAILED'
  | 'EXTRACTION_FAILED'

export type AssemblyResult =
  | {
      ok: true
      households: Household[]
      issues: ValidationIssue[]
      liquidacao?: LiquidacaoParsed
    }
  | {
      ok: false
      code: AssemblyErrorCode
      /** Human-readable validation messages (for VALIDATION_FAILED) */
      validationMessages?: string[]
    }

// ─── Constants ──────────────────────────────────────────────

/** Default general deduction expense for taxpayers without liquidação or pasted data.
 *  €250 is the cap at 35% rate → €250 × 35% = €87.50 deduction. Conservative default. */
export const DEFAULT_GENERAL_DEDUCTION_AMOUNT = 250

export const LIQUIDACAO_DEDUCTION_MAP: {
  field: keyof LiquidacaoParsed
  category: DeductionCategory
  rate: number
}[] = [
  { field: 'deducoesGerais', category: 'general', rate: 0.35 },
  { field: 'deducoesSaude', category: 'health', rate: 0.15 },
  { field: 'deducoesEducacao', category: 'education', rate: 0.3 },
  { field: 'deducoesExigenciaFatura', category: 'fatura', rate: 0.15 },
]

// ─── Helpers ────────────────────────────────────────────────

function toFileInfo(af: AssemblyFile): FileInfo {
  const docType: DocumentType = af.parsedXml
    ? 'xml_modelo3'
    : af.parsedLiquidacao
      ? 'pdf_liquidacao'
      : 'pdf_comprovativo'
  return {
    name: af.fileName,
    year: af.year,
    nif: af.nif,
    nifConjuge: af.nifConjuge,
    docType,
  }
}

// ─── Main Assembly Function ─────────────────────────────────

/**
 * Pure function that assembles households from parsed document data.
 *
 * Returns structured error codes on failure (caller translates to UI strings).
 * Mandatory deduction slot validation is the caller's responsibility —
 * this function only assembles and merges data.
 */
export function assembleHouseholds(input: AssemblyInput): AssemblyResult {
  const { sectionFiles, pastedDeductions, deductionSlots } = input

  // Guard: must have at least one declaration
  if (sectionFiles.declaration.length === 0) {
    return { ok: false, code: 'NEED_DECLARATION' }
  }

  // Guard: no files still processing
  const allFiles = [
    ...sectionFiles.declaration,
    ...sectionFiles.liquidacao,
    ...sectionFiles.previousYears,
  ]
  if (allFiles.some((f) => f.status === 'processing')) {
    return { ok: false, code: 'STILL_PROCESSING' }
  }

  // Cross-file validation
  const declInfos = sectionFiles.declaration.filter((f) => f.status === 'done').map(toFileInfo)
  const liqInfos = sectionFiles.liquidacao.filter((f) => f.status === 'done').map(toFileInfo)
  const prevInfos = sectionFiles.previousYears.filter((f) => f.status === 'done').map(toFileInfo)

  const preErrors = [
    ...validateDeclarationFiles(declInfos),
    ...validateLiquidacaoFiles(liqInfos, declInfos),
    ...validatePreviousYearsFiles(prevInfos),
    ...validateCrossSection(declInfos, prevInfos),
  ].filter((e) => e.severity !== 'warning')

  if (preErrors.length > 0) {
    return {
      ok: false,
      code: 'VALIDATION_FAILED',
      validationMessages: preErrors.map((e) => e.message),
    }
  }

  // ── Assemble primary household ──────────────────────────

  let household: Household | null = null
  const allIssues: ValidationIssue[] = []
  let liquidacaoResult: LiquidacaoParsed | undefined
  let declarationYear: number | undefined

  const parsedDeclarations: Array<{
    household: Household
    nif: string
    nifConjuge?: string
    issues: ValidationIssue[]
  }> = []

  // Prefer XML declarations; fall back to PDF comprovativos only if no XML exists
  for (const uf of sectionFiles.declaration) {
    if (uf.status !== 'done') continue

    if (uf.parsedXml) {
      parsedDeclarations.push({
        household: uf.parsedXml.household,
        nif: uf.nif ?? uf.parsedXml.raw.subjectA_nif,
        nifConjuge: uf.nifConjuge ?? uf.parsedXml.raw.subjectB_nif,
        issues: uf.parsedXml.issues,
      })
    }
  }

  if (parsedDeclarations.length === 0) {
    for (const uf of sectionFiles.declaration) {
      if (uf.status !== 'done') continue

      if (uf.parsedComprovativo) {
        const converted = comprativoParsedToHousehold(uf.parsedComprovativo)
        if (converted.household.members && converted.household.members.length > 0) {
          parsedDeclarations.push({
            household: converted.household as Household,
            nif: uf.nif ?? '',
            nifConjuge: uf.nifConjuge,
            issues: [
              ...converted.issues,
              {
                severity: 'warning',
                code: 'PDF_FALLBACK',
                message: 'Data extracted from PDF comprovativo — XML provides higher fidelity.',
              },
            ],
          })
        }
      }
    }
  }

  // Merge spouse declarations or use first
  const merged = mergeSpouseHouseholds(parsedDeclarations)
  if (merged) {
    household = merged.household
    declarationYear = merged.household.year
    allIssues.push(...merged.issues)
  } else if (parsedDeclarations.length > 0) {
    const first = parsedDeclarations[0]
    household = first.household
    declarationYear = first.household.year
    allIssues.push(...first.issues)

    // When only one declaration uploaded for a married household,
    // strip the empty spouse placeholder — we can't compute joint filing
    // or show aggregate results without real spouse data.
    if (first.nifConjuge && household.members.length >= 2) {
      household.spouse_data_incomplete = true
      household.members = [household.members[0]]
    }
  }

  // ── Assemble liquidação ─────────────────────────────────

  const allLiquidacaoResults: LiquidacaoParsed[] = []
  for (const uf of sectionFiles.liquidacao) {
    if (uf.status !== 'done') continue

    if (uf.parsedLiquidacao) {
      const liq = uf.parsedLiquidacao
      allLiquidacaoResults.push(liq)
      liquidacaoResult = liq

      if (liq.year && declarationYear && liq.year !== declarationYear) {
        allIssues.push({
          severity: 'error',
          code: 'YEAR_MISMATCH',
          message: `Liquidação year (${liq.year}) does not match declaration year (${declarationYear}).`,
        })
      }
    }
  }

  // ── Assemble previous years ─────────────────────────────

  const previousYearsParsed = new Map<
    number,
    Array<{
      household: Household
      nif: string
      nifConjuge?: string
      issues: ValidationIssue[]
    }>
  >()

  // Prefer XML; fall back to comprovativos for years with no XML
  const prevYearXmlYears = new Set<number>()

  for (const uf of sectionFiles.previousYears) {
    if (uf.status !== 'done' || !uf.parsedXml) continue

    const year = uf.year ?? uf.parsedXml.household.year
    prevYearXmlYears.add(year)

    if (declarationYear && year === declarationYear) {
      allIssues.push({
        severity: 'warning',
        code: 'YEAR_OVERLAP',
        message: `Previous year file has same year (${year}) as primary declaration — skipped.`,
      })
      continue
    }

    if (!previousYearsParsed.has(year)) previousYearsParsed.set(year, [])
    previousYearsParsed.get(year)!.push({
      household: uf.parsedXml.household,
      nif: uf.nif ?? uf.parsedXml.raw.subjectA_nif,
      nifConjuge: uf.nifConjuge ?? uf.parsedXml.raw.subjectB_nif,
      issues: uf.parsedXml.issues,
    })
  }

  // PDF comprovativo fallback for previous years without XML
  for (const uf of sectionFiles.previousYears) {
    if (uf.status !== 'done' || !uf.parsedComprovativo) continue
    const year = uf.year ?? uf.parsedComprovativo.year
    if (year == null) continue // skip if year unknown
    if (prevYearXmlYears.has(year)) continue // XML already parsed for this year

    if (declarationYear && year === declarationYear) continue // skip overlap

    const converted = comprativoParsedToHousehold(uf.parsedComprovativo)
    if (!converted.household.members || converted.household.members.length === 0) continue

    if (!previousYearsParsed.has(year)) previousYearsParsed.set(year, [])
    previousYearsParsed.get(year)!.push({
      household: converted.household as Household,
      nif: uf.nif ?? '',
      nifConjuge: uf.nifConjuge,
      issues: [
        ...converted.issues,
        {
          severity: 'warning',
          code: 'PDF_FALLBACK',
          message: 'Data extracted from PDF comprovativo — XML provides higher fidelity.',
        },
      ],
    })
  }

  const previousHouseholds: Household[] = []
  for (const [, yearDecls] of previousYearsParsed) {
    const m = mergeSpouseHouseholds(yearDecls)
    if (m) {
      previousHouseholds.push(m.household)
      allIssues.push(...m.issues)
    } else if (yearDecls.length > 0) {
      const prevHousehold = yearDecls[0].household
      if (yearDecls[0].nifConjuge && prevHousehold.members.length >= 2) {
        prevHousehold.spouse_data_incomplete = true
        prevHousehold.members = [prevHousehold.members[0]]
      }
      previousHouseholds.push(prevHousehold)
      allIssues.push(...yearDecls[0].issues)
    }
  }

  // ── Merge pasted deductions ─────────────────────────────

  if (household) {
    const pastedNifs = new Set<string>()

    for (const [slotKey, entry] of pastedDeductions) {
      if (!entry.result.ok) continue
      const parsed = entry.result.data

      if (parsed.year !== household.year) continue

      const slot = deductionSlots.find((s) => s.key === slotKey)
      if (!slot) continue

      if (slot.role === 'taxpayer') {
        const member =
          household.members.find((m) => m.incomes.length > 0 && m.name === parsed.name) ??
          household.members.find((_, i) => {
            const declFile = sectionFiles.declaration.find(
              (f) => f.status === 'done' && f.nif === parsed.nif,
            )
            if (!declFile) return false
            const isSubjectA = declFile.nif === parsed.nif && !declFile.nifConjuge
            const isSubjectB = declFile.nifConjuge === parsed.nif
            return (
              (i === 0 && isSubjectA) ||
              (i === 1 && isSubjectB) ||
              (i === 0 && !isSubjectA && !isSubjectB)
            )
          })

        if (member) {
          pastedNifs.add(slot.nif)
          const atCategories = new Set(parsed.expenses.map((e) => e.category))
          member.deductions = member.deductions.filter((d) => !atCategories.has(d.category))
          for (const exp of parsed.expenses) {
            if (exp.expenseAmount > 0) {
              member.deductions.push({
                category: exp.category,
                amount: exp.expenseAmount,
              })
            }
          }
        }
      } else {
        const firstMember = household.members[0]
        if (firstMember) {
          for (const exp of parsed.expenses) {
            if (exp.expenseAmount > 0) {
              const existing = firstMember.deductions.find((d) => d.category === exp.category)
              if (existing) {
                existing.amount += exp.expenseAmount
              } else {
                firstMember.deductions.push({
                  category: exp.category,
                  amount: exp.expenseAmount,
                })
              }
            }
          }
        }
      }
    }

    // Fallback: derive deductions from liquidação for members without pasted data
    if (allLiquidacaoResults.length > 0 && household.year === (liquidacaoResult?.year ?? 0)) {
      const liqByNif = new Map<string, LiquidacaoParsed>()
      for (const liq of allLiquidacaoResults) {
        if (liq.nif) liqByNif.set(liq.nif, liq)
      }

      household = {
        ...household,
        members: household.members.map((member, mi) => {
          const declFile = sectionFiles.declaration.find((f) => f.status === 'done' && f.nif)
          const memberNif = mi === 0 ? declFile?.nif : declFile?.nifConjuge
          if (memberNif && pastedNifs.has(memberNif)) return member

          const memberLiq =
            (memberNif ? liqByNif.get(memberNif) : undefined) ??
            (allLiquidacaoResults.length === 1 ? allLiquidacaoResults[0] : undefined)

          if (!memberLiq) return member

          const newDeductions = [...member.deductions]
          for (const mapping of LIQUIDACAO_DEDUCTION_MAP) {
            const deductionAmount = memberLiq[mapping.field] as number | undefined
            if (!deductionAmount || deductionAmount <= 0) continue
            const expenseAmount = deductionAmount / mapping.rate

            const existing = newDeductions.findIndex((d) => d.category === mapping.category)
            if (existing >= 0) {
              newDeductions[existing] = {
                ...newDeductions[existing],
                amount: expenseAmount,
              }
            } else {
              newDeductions.push({
                category: mapping.category,
                amount: expenseAmount,
              })
            }
          }
          return { ...member, deductions: newDeductions }
        }),
      }
    }

    // Apply default general deduction for taxpayers with no deduction data
    household = applyDefaultDeductions(household)
  }

  // ── Build final result ──────────────────────────────────

  if (household) {
    const allHouseholds = [household, ...previousHouseholds.map(applyDefaultDeductions)].sort(
      (a, b) => b.year - a.year,
    )
    return {
      ok: true,
      households: allHouseholds,
      issues: allIssues,
      liquidacao: liquidacaoResult,
    }
  }

  if (previousHouseholds.length > 0) {
    const allHouseholds = previousHouseholds
      .map(applyDefaultDeductions)
      .sort((a, b) => b.year - a.year)
    return {
      ok: true,
      households: allHouseholds,
      issues: allIssues,
      liquidacao: liquidacaoResult,
    }
  }

  return { ok: false, code: 'EXTRACTION_FAILED' }
}

/**
 * For each taxpayer member without any 'general' deduction,
 * inject a conservative default (€250 — the per-person general cap).
 */
function applyDefaultDeductions(h: Household): Household {
  const members = h.members.map((m) => {
    const hasGeneral = m.deductions.some((d) => d.category === 'general')
    if (hasGeneral) return m
    return {
      ...m,
      deductions: [
        ...m.deductions,
        { category: 'general' as const, amount: DEFAULT_GENERAL_DEDUCTION_AMOUNT },
      ],
    }
  })
  return { ...h, members }
}
