// ─── Upload Validation ───────────────────────────────────────
// Pure functions for cross-file validation of uploaded documents.
// No React/DOM dependencies — fully testable in Node.

import type { DocumentType } from './pdf-extractor'
import type { Household, Person, ValidationIssue } from './types'

export interface FileInfo {
  name: string
  nif?: string
  year?: number
  filingStatus?: string // 'single' | 'married_joint' | 'married_separate'
  docType: DocumentType
  nifConjuge?: string
}

// ─── Deduction Slot Types ──────────────────────────────────

export type SlotRole = 'taxpayer' | 'dependent' | 'ascendant'

export interface DeductionSlot {
  key: string
  nif: string
  year: number
  role: SlotRole
  hasLiquidacao: boolean
}

/** Minimal subset of parsed file info needed for slot computation */
export interface SlotFileInfo {
  status: 'done' | 'processing' | 'error' | 'pending'
  year?: number
  nif?: string
  nifConjuge?: string
  dependentNifs?: string[]
  ascendantNifs?: string[]
  liquidacaoYear?: number
}

/**
 * Compute deduction paste slots from parsed declaration files.
 *
 * A slot is generated for each unique (NIF, year) pair found in declarations
 * (taxpayers, spouses, dependents, ascendants). Slots are marked with
 * `hasLiquidacao: true` when a liquidação document covers that year.
 *
 * Sorted: taxpayer → dependent → ascendant, then by NIF, then year desc.
 */
export function computeDeductionSlots(
  declarations: SlotFileInfo[],
  liquidacaoFiles: SlotFileInfo[],
): DeductionSlot[] {
  const slots: DeductionSlot[] = []
  const seen = new Set<string>()

  // Compute which years have a liquidação available
  const liquidacaoYears = new Set<number>()
  for (const f of liquidacaoFiles) {
    if (f.status === 'done' && f.liquidacaoYear) {
      liquidacaoYears.add(f.liquidacaoYear)
    }
  }

  function addSlot(nif: string, year: number, role: SlotRole) {
    const key = `${nif}-${year}`
    if (seen.has(key)) return
    seen.add(key)
    slots.push({ key, nif, year, role, hasLiquidacao: liquidacaoYears.has(year) })
  }

  for (const f of declarations) {
    if (f.status !== 'done' || !f.year) continue
    const year = f.year

    // Taxpayer NIFs
    if (f.nif) addSlot(f.nif, year, 'taxpayer')
    if (f.nifConjuge) addSlot(f.nifConjuge, year, 'taxpayer')

    // Dependent NIFs
    if (f.dependentNifs) {
      for (const nif of f.dependentNifs) addSlot(nif, year, 'dependent')
    }

    // Ascendant NIFs
    if (f.ascendantNifs) {
      for (const nif of f.ascendantNifs) addSlot(nif, year, 'ascendant')
    }
  }

  // Sort: by role → NIF (all years for same person together) → year desc
  const roleOrder: Record<SlotRole, number> = { taxpayer: 0, dependent: 1, ascendant: 2 }
  return slots.sort(
    (a, b) =>
      roleOrder[a.role] - roleOrder[b.role] || a.nif.localeCompare(b.nif) || b.year - a.year,
  )
}

/**
 * Determine which deduction slots are mandatory but unfilled.
 *
 * Only taxpayer slots WITHOUT a liquidação are mandatory.
 * Dependent/ascendant slots are always optional.
 */
export function getMandatoryUnfilledSlots(
  slots: DeductionSlot[],
  pastedKeys: Set<string>,
): DeductionSlot[] {
  return slots.filter((s) => s.role === 'taxpayer' && !s.hasLiquidacao && !pastedKeys.has(s.key))
}

export interface UploadValidationError {
  file: string
  message: string
  severity?: 'error' | 'warning'
}

// ─── Year Helpers ──────────────────────────────────────────

// Earliest year we support for previous-years uploads
const MIN_CONTEXT_YEAR = 2021

/**
 * Years for which IRS can still be submitted or amended.
 * Amendment deadline: June 30 of taxYear+3 (2 years after submission deadline of June 30 taxYear+1).
 * Per CPPT Art. 59.º / CIRS Art. 122.º.
 */
export function getAmendableYears(now: Date = new Date()): number[] {
  const latestTaxYear = now.getFullYear() - 1
  const years: number[] = []
  for (let y = latestTaxYear; y >= MIN_CONTEXT_YEAR; y--) {
    const deadline = new Date(y + 3, 5, 30, 23, 59, 59)
    if (now <= deadline) years.push(y)
  }
  return years.sort((a, b) => b - a)
}

/**
 * All years from MIN_CONTEXT_YEAR to the latest tax year.
 */
export function getAllSupportedYears(now: Date = new Date()): number[] {
  const latestTaxYear = now.getFullYear() - 1
  const years: number[] = []
  for (let y = MIN_CONTEXT_YEAR; y <= latestTaxYear; y++) {
    years.push(y)
  }
  return years.sort((a, b) => b - a)
}

// ─── File Limits ───────────────────────────────────────────

// 2 doc types (declaration + liquidação) × 2 taxpayers per year
const FILES_PER_PREVIOUS_YEAR = 4

/**
 * Maximum number of files allowed in the previous-years upload section.
 * Based on the primary declaration year: all years from MIN_CONTEXT_YEAR
 * up to (but not including) the primary year.
 */
export function maxPreviousYearsFiles(primaryYear: number | undefined): number {
  if (primaryYear == null || primaryYear <= MIN_CONTEXT_YEAR) return 0
  return (primaryYear - MIN_CONTEXT_YEAR) * FILES_PER_PREVIOUS_YEAR
}

// ─── Declaration Files ─────────────────────────────────────

export function validateDeclarationFiles(files: FileInfo[]): UploadValidationError[] {
  const errors: UploadValidationError[] = []

  if (files.length > 2) {
    errors.push({
      file: files[2].name,
      message: 'Máximo de 2 declarações (Sujeito Passivo A + B).',
    })
    return errors
  }

  if (files.length < 2) {
    // Single declaration — check if it references a spouse who should also be uploaded
    if (files.length === 1) {
      const f = files[0]
      if (f.nifConjuge) {
        errors.push({
          file: f.name,
          message:
            `A declaração contém o cônjuge/unido de facto (NIF ${f.nifConjuge}). ` +
            `Carregue também a declaração do cônjuge para uma análise completa do agregado.`,
          severity: 'warning',
        })
      }
    }
    return errors
  }

  const [a, b] = files

  // Must be same year
  if (a.year != null && b.year != null && a.year !== b.year) {
    errors.push({
      file: b.name,
      message: `Ano diferente da primeira declaração (${a.year} vs ${b.year}). Ambas devem ser do mesmo ano fiscal.`,
    })
    return errors
  }

  // Same NIF → duplicate
  if (a.nif && b.nif && a.nif === b.nif) {
    errors.push({
      file: b.name,
      message: `NIF duplicado (${b.nif}). As duas declarações devem pertencer a contribuintes diferentes.`,
    })
    return errors
  }

  // Check spouse relationship
  if (a.nif && b.nif) {
    const aMatchesBConjuge = b.nifConjuge != null && a.nif === b.nifConjuge
    const bMatchesAConjuge = a.nifConjuge != null && b.nif === a.nifConjuge

    const hasConjugeInfo = a.nifConjuge != null || b.nifConjuge != null

    if (hasConjugeInfo && !aMatchesBConjuge && !bMatchesAConjuge) {
      errors.push({
        file: b.name,
        message: `Os NIFs das declarações não correspondem a cônjuges. Verifique se pertencem ao mesmo agregado familiar.`,
        severity: 'warning',
      })
    }
  }

  return errors
}

// ─── Liquidação Files ──────────────────────────────────────

export function validateLiquidacaoFiles(
  files: FileInfo[],
  declarationFiles: FileInfo[],
): UploadValidationError[] {
  const errors: UploadValidationError[] = []

  if (files.length > 2) {
    errors.push({
      file: files[2].name,
      message: 'Máximo de 2 demonstrações de liquidação.',
    })
    return errors
  }

  // Duplicate NIF check
  if (files.length === 2 && files[0].nif && files[1].nif && files[0].nif === files[1].nif) {
    errors.push({
      file: files[1].name,
      message: `NIF duplicado na liquidação (${files[1].nif}).`,
    })
  }

  const declNifs = declarationFiles.filter((d) => d.nif).map((d) => d.nif!)
  const declYears = declarationFiles.filter((d) => d.year != null).map((d) => d.year!)

  for (const f of files) {
    // NIF must match a declaration NIF
    if (f.nif && declNifs.length > 0 && !declNifs.includes(f.nif)) {
      errors.push({
        file: f.name,
        message: `NIF da liquidação (${f.nif}) não corresponde a nenhuma declaração carregada.`,
      })
    }

    // Year must match a declaration year
    if (f.year != null && declYears.length > 0 && !declYears.includes(f.year)) {
      errors.push({
        file: f.name,
        message: `Ano da liquidação (${f.year}) não corresponde ao ano da declaração.`,
      })
    }
  }

  return errors
}

// ─── Previous Years Files ──────────────────────────────────

export function validatePreviousYearsFiles(files: FileInfo[]): UploadValidationError[] {
  const errors: UploadValidationError[] = []

  // Group by year
  const byYear = new Map<number, FileInfo[]>()
  for (const f of files) {
    if (f.year == null) continue
    const group = byYear.get(f.year) ?? []
    group.push(f)
    byYear.set(f.year, group)
  }

  for (const [year, group] of byYear) {
    if (group.length > FILES_PER_PREVIOUS_YEAR) {
      errors.push({
        file: group[FILES_PER_PREVIOUS_YEAR].name,
        message: `Máximo de ${FILES_PER_PREVIOUS_YEAR} ficheiros por ano (${year}).`,
      })
      continue
    }

    // Check for duplicate NIF+docType combinations within the same year
    const seen = new Set<string>()
    for (const f of group) {
      if (!f.nif) continue
      const key = `${f.nif}:${f.docType}`
      if (seen.has(key)) {
        errors.push({
          file: f.name,
          message: `NIF duplicado para o ano ${year} (${f.nif}).`,
        })
      }
      seen.add(key)
    }

    // Check for missing spouse declarations
    const declarationTypes: DocumentType[] = ['xml_modelo3', 'pdf_comprovativo']
    const declarations = group.filter((f) => declarationTypes.includes(f.docType))
    const declNifs = new Set(declarations.filter((f) => f.nif).map((f) => f.nif!))
    for (const f of declarations) {
      if (f.nifConjuge && !declNifs.has(f.nifConjuge)) {
        errors.push({
          file: f.name,
          message:
            `A declaração de ${year} contém o cônjuge/unido de facto (NIF ${f.nifConjuge}). ` +
            `Carregue também a declaração do cônjuge para uma análise completa.`,
          severity: 'warning',
        })
      }
    }
  }

  return errors
}

// ─── Cross-Section Validation ──────────────────────────────

export function validateCrossSection(
  declaration: FileInfo[],
  previousYears: FileInfo[],
): UploadValidationError[] {
  const errors: UploadValidationError[] = []

  const declYears = new Set(declaration.filter((f) => f.year != null).map((f) => f.year!))
  for (const f of previousYears) {
    if (f.year != null && declYears.has(f.year)) {
      errors.push({
        file: f.name,
        message: `O ano ${f.year} já está na declaração principal. Será utilizada a declaração principal.`,
        severity: 'warning',
      })
    }
  }

  return errors
}

// ─── Spouse Household Merging ──────────────────────────────

export interface ParsedDeclaration {
  household: Household
  nif: string
  nifConjuge?: string
  issues: ValidationIssue[]
}

/**
 * Merge two separate declarations from spouses into a single household.
 *
 * When spouses file separately (married_separate), each XML contains one
 * person's full data and the other as an empty placeholder. This function
 * takes both parsed results and produces a unified household with both
 * spouses' incomes, deductions, and special regimes.
 *
 * Returns null if merging is not applicable (e.g., single declaration).
 */
export function mergeSpouseHouseholds(
  declarations: ParsedDeclaration[],
): { household: Household; issues: ValidationIssue[] } | null {
  if (declarations.length !== 2) return null

  const [a, b] = declarations

  // Verify they are spouses — at least one must reference the other's NIF
  const aRefersB = a.nifConjuge != null && a.nifConjuge === b.nif
  const bRefersA = b.nifConjuge != null && b.nifConjuge === a.nif
  if (!aRefersB && !bRefersA) return null

  // Same year required
  if (a.household.year !== b.household.year) return null

  // Use A as the base household. B's subject A data (personA in B's XML)
  // corresponds to A's personB (the spouse placeholder).
  const base = structuredClone(a.household)
  const spouseSource = b.household.members[0] // B's subject A = the real spouse data

  if (!spouseSource) return null

  if (base.members.length >= 2) {
    // Replace the empty placeholder (personB) with the real data from B's declaration
    const placeholder = base.members[1]
    base.members[1] = mergePersonData(placeholder, spouseSource)
  } else {
    // No placeholder — just add the spouse
    base.members.push(spouseSource)
  }

  // Ensure filing status reflects married
  if (base.filing_status === 'single') {
    base.filing_status = 'married_separate'
  }

  // Merge dependents/ascendants (deduplicate by name)
  const bDeps = b.household.dependents ?? []
  for (const dep of bDeps) {
    if (!base.dependents.some((d) => d.name === dep.name)) {
      base.dependents.push(dep)
    }
  }
  const bAsc = b.household.ascendants ?? []
  const baseAsc = base.ascendants ?? []
  for (const asc of bAsc) {
    if (!baseAsc.some((a) => a.name === asc.name)) {
      baseAsc.push(asc)
    }
  }
  base.ascendants = baseAsc

  // Combine issues from both
  const mergedIssues = [...a.issues, ...b.issues]

  return { household: base, issues: mergedIssues }
}

/** Merge real spouse data onto a placeholder person, preserving any existing values. */
function mergePersonData(placeholder: Person, source: Person): Person {
  return {
    name: source.name || placeholder.name,
    nif: source.nif ?? placeholder.nif,
    birth_year: source.birth_year ?? placeholder.birth_year,
    incomes: source.incomes.length > 0 ? source.incomes : placeholder.incomes,
    deductions: source.deductions.length > 0 ? source.deductions : placeholder.deductions,
    special_regimes:
      source.special_regimes.length > 0 ? source.special_regimes : placeholder.special_regimes,
    irs_jovem_year: source.irs_jovem_year ?? placeholder.irs_jovem_year,
    irs_jovem_first_work_year:
      source.irs_jovem_first_work_year ?? placeholder.irs_jovem_first_work_year,
    irs_jovem_degree_year: source.irs_jovem_degree_year ?? placeholder.irs_jovem_degree_year,
    nhr_start_year: source.nhr_start_year ?? placeholder.nhr_start_year,
    nhr_confirmed: source.nhr_confirmed ?? placeholder.nhr_confirmed,
    disability_degree: source.disability_degree ?? placeholder.disability_degree,
  }
}
