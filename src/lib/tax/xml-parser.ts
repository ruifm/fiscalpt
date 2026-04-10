import type {
  Household,
  Person,
  Income,
  Dependent,
  Ascendant,
  FilingStatus,
  IncomeCategory,
  DeductionCategory,
  ValidationIssue,
} from './types'

// ─── Civil Status (Q04B01) ──────────────────────────────────
// Verified against real AT XML exports (2021-2024):
//   1 = casado(a)        — married
//   2 = unido(a) de facto — civil union
//   3 = não casado(a)    — single/divorced/widowed
export type CivilStatus = 1 | 2 | 3 | 4 | 5 | 6

// ─── Declaration Nature (Q08B01) ────────────────────────────
//   1 = primeira declaração    — first declaration for this tax year
//   2 = declaração de substituição — replacement/amendment declaration
// NOTE: Q08B01 does NOT control joint vs separate taxation.
// Filing mode is determined by Q05B01: S = joint (has Subject B), absent/N = separate.
export type DeclarationNature = 1 | 2

// ─── Parsed raw data ───────────────────────────────────────

export interface ParsedAnexoBRaw {
  nif: string
  regime: 'simplified' | 'organized' | null // Q01B01: 1=simplified, 2=organized
  activityCode?: string // Q03C07: tabela de atividades
  cae?: string // Q03C08: CAE code
  firstYear?: boolean // Q03B10: S=first year declared this year
  incomeByCode: Record<number, number> // C401-C408 amounts
  totalGross: number // SomaC01
  documentedExpensesSales: number // SomaC02
  documentedExpensesOther: number // SomaC03
  withholding: number // Q06C603
  priorYearIncome?: number // Q13C1305
}

export interface ParsedAnexoSSRaw {
  nif: string
  niss?: string // Q03C07: NISS
  catBIncome: number // Q04C1: total Cat B for SS
  incomeByCode: Record<number, number> // Q04C4xx income codes
  otherIncome: number // Q05C1
  foreignActivity: boolean // Q06B1: activity exercised abroad (EU SS coordination)
  foreignActivityEntries: Array<{
    country: string // Pais code (e.g. 724=Spain)
    foreignNif: string // NFiscalEstrangeiro
    amount: number // Valor (income amount, not SS contribution)
  }>
}

export interface ParsedDependentRaw {
  nif: string
  sharedCustody?: boolean
  disabilityDegree?: number
  expenseSharePercent?: number // Partilha de despesas %
  otherParentNif?: string
}

export interface ParsedAscendantRaw {
  nif: string
  income?: number
  disabilityDegree?: number
}

export interface ParsedXmlResult {
  household: Household
  raw: {
    subjectA_nif: string
    subjectA_name: string
    subjectB_nif?: string
    year: number
    civilStatus: number
    englobamento?: boolean // Q05B01: S/N (deprecated — was mislabeled, now disability)
    disabilitySPA?: number // Q05: SP A disability degree (0 = none)
    disabilitySPB?: number // Q05: SP B disability degree (0 = none)
    filingOption?: number // Q08B01: 1=primeira declaração, 2=substituição
    dependents: ParsedDependentRaw[]
    godchildren: ParsedDependentRaw[] // BT03
    ascendants: ParsedAscendantRaw[]
    anexoB: ParsedAnexoBRaw[]
    anexoSS: ParsedAnexoSSRaw[]
    // Cat A/H income code per line
    catAIncomeCodes: Array<{ titular: string; code: number; gross: number }>
    // Anexos present in declaration
    anexosPresent: string[]
    iban?: string // Q09C01
    isJointDeclaration?: boolean // Q05B01=S: Subject B present in the same XML
  }
  issues: ValidationIssue[]
}

// ─── Shared Constants ────────────────────────────────────────

const CAT_B_INCOME_CODES = [401, 402, 403, 404, 405, 406, 407, 408] as const

// Run a section parser safely — on failure, push a warning and return the fallback value
export function safeParseSection<T>(
  sectionName: string,
  issues: ValidationIssue[],
  fallback: T,
  fn: () => T,
): T {
  try {
    return fn()
  } catch (err) {
    issues.push({
      severity: 'warning',
      code: 'SECTION_PARSE_ERROR',
      message: `Não foi possível ler ${sectionName}: ${err instanceof Error ? err.message : String(err)}`,
    })
    return fallback
  }
}

function findElement(parent: Element | Document, localName: string): Element | null {
  const all = parent.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i]
  }
  return null
}

function findAllElements(parent: Element | Document, localName: string): Element[] {
  const results: Element[] = []
  const all = parent.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) results.push(all[i])
  }
  return results
}

function getText(parent: Element | Document, ...tags: string[]): string | null {
  let current: Element | Document = parent
  for (const tag of tags) {
    const found = findElement(current, tag)
    if (!found) return null
    current = found
  }
  return (current as Element).textContent?.trim() || null
}

function getFloat(parent: Element | Document, ...tags: string[]): number {
  return parseFloat(getText(parent, ...tags) || '0') || 0
}

function getInt(parent: Element | Document, ...tags: string[]): number {
  return parseInt(getText(parent, ...tags) || '0') || 0
}

function getBool(parent: Element | Document, ...tags: string[]): boolean | undefined {
  const val = getText(parent, ...tags)
  if (val === null) return undefined
  return val === 'S' || val === 'true' || val === '1'
}

// ─── Rosto (Front Page) Parsing ─────────────────────────────

interface RostoData {
  year: number
  subjectA_nif: string
  subjectA_name: string
  civilStatus: number
  disabilitySPA?: number // Q05B01+degree: SP A disability (0 = none)
  disabilitySPB?: number // Q05SPB+degree: SP B disability (0 = none)
  subjectB_nif?: string
  filingOption?: number
  iban?: string
  dependents: ParsedDependentRaw[]
  sharedCustodyDependents: ParsedDependentRaw[]
  godchildren: ParsedDependentRaw[]
  ascendants: ParsedAscendantRaw[]
  isJointDeclaration: boolean
}

function parseRosto(doc: Document, _issues: ValidationIssue[]): RostoData {
  const year = getInt(doc, 'Q02C01') || new Date().getFullYear()
  const subjectA_nif = getText(doc, 'Q03C01') || ''
  const subjectA_name = getText(doc, 'Q03SPA') || `Titular ${subjectA_nif}`
  const civilStatus = getInt(doc, 'Q04B01') || 3

  // Q05: Subject B and Disability
  // Q05B01 = "Existe Sujeito Passivo B?" (S/N) — NOT a disability flag
  // Q05C03 = Subject B NIF (present when Q05B01=S in joint declarations)
  // Q05C01 = SP A disability degree (0 or absent = no disability)
  const hasSubjectB = getText(doc, 'Q05B01') === 'S'
  const disabilitySPA = getInt(doc, 'Q05C01') || 0

  // Q05SPB sub-section for SP B disability
  const q05spb = findElement(doc, 'Q05SPB')
  const disabilityDegreeSPB = q05spb ? getInt(q05spb, 'Q05C02') : undefined
  const disabilitySPB = disabilityDegreeSPB || 0

  // Subject B NIF: Q05C03 (correct, from Quadro 05) with Q06C01 fallback
  // Q06C01 is "NIF do outro sujeito passivo do agregado" in Quadro 06 — used by
  // some older single-filer XMLs that reference the other household member.
  const subjectB_nif = getText(doc, 'Q05C03') || getText(doc, 'Q06C01') || undefined
  const filingOption = getInt(doc, 'Q08B01') || undefined
  const iban = getText(doc, 'Q09C01') || undefined

  // BT01: Regular dependents
  const dependents = findAllElements(doc, 'Rostoq06BT01-Linha')
    .map((line) => {
      const nif = getText(line, 'NIF')
      if (!nif) return null
      const raw = getText(line, 'GrauDeficiencia')
      return {
        nif,
        // Absence of GrauDeficiencia in the XML means no disability (0)
        disabilityDegree: raw !== null ? parseFloat(raw) || 0 : 0,
      } as ParsedDependentRaw
    })
    .filter((d): d is ParsedDependentRaw => d !== null)

  // BT02: Shared custody dependents
  const sharedCustodyDependents: ParsedDependentRaw[] = findAllElements(doc, 'Rostoq06BT02-Linha')
    .map((line) => {
      const nif = getText(line, 'NIF')
      if (!nif) return null
      const raw = getText(line, 'GrauDeficiencia')
      return {
        nif,
        sharedCustody: true,
        disabilityDegree: raw !== null ? parseFloat(raw) || 0 : 0,
        expenseSharePercent: parseFloat(getText(line, 'PartilhaDespesas') || '') || undefined,
        otherParentNif: getText(line, 'NIFOutroSP') || getText(line, 'NIFOutro') || undefined,
      } as ParsedDependentRaw
    })
    .filter((d): d is ParsedDependentRaw => d !== null)

  // BT03: Godchildren (afilhados civis — treated as dependents)
  const godchildren = findAllElements(doc, 'Rostoq06BT03-Linha')
    .map((line) => {
      const nif = getText(line, 'NIF')
      if (!nif) return null
      const raw = getText(line, 'GrauDeficiencia')
      return {
        nif,
        disabilityDegree: raw !== null ? parseFloat(raw) || 0 : 0,
      } as ParsedDependentRaw
    })
    .filter((d): d is ParsedDependentRaw => d !== null)

  // Q07 AT01: Ascendants
  const ascendants: ParsedAscendantRaw[] = findAllElements(doc, 'Rostoq07AT01-Linha')
    .map((line) => {
      const nif = getText(line, 'NIF')
      if (!nif) return null
      const rawDisability = getText(line, 'GrauDeficiencia')
      return {
        nif,
        income:
          parseFloat(getText(line, 'Rendimento') || getText(line, 'Rendimentos') || '') ||
          undefined,
        disabilityDegree: rawDisability !== null ? parseFloat(rawDisability) || 0 : 0,
      } as ParsedAscendantRaw
    })
    .filter((a): a is ParsedAscendantRaw => a !== null)

  return {
    year,
    subjectA_nif,
    subjectA_name,
    civilStatus,
    disabilitySPA,
    disabilitySPB,
    subjectB_nif,
    filingOption,
    iban,
    dependents,
    sharedCustodyDependents,
    godchildren,
    ascendants,
    isJointDeclaration: hasSubjectB,
  }
}

// ─── Anexo A — Cat A (Employment) + Cat H (Pensions) ────────

interface AnexoALine {
  titular: string
  category: 'A' | 'H'
  incomeCode: number
  employerNif: string
  gross: number
  withholding: number
  ssPaid: number
  unionDues: number
}

function parseAnexoA(doc: Document, _issues: ValidationIssue[]): AnexoALine[] {
  const tables: Array<{ element: string; category: 'A' | 'H'; defaultCode: number }> = [
    { element: 'AnexoAq04AT01-Linha', category: 'A', defaultCode: 401 },
    { element: 'AnexoAq04BT01-Linha', category: 'H', defaultCode: 501 },
  ]

  return tables.flatMap(({ element, category, defaultCode }) =>
    findAllElements(doc, element)
      .map((line) => ({
        titular: getText(line, 'Titular') || 'A',
        category,
        incomeCode: getInt(line, 'CodRendimentos') || defaultCode,
        employerNif: getText(line, 'NIF') || '',
        gross: getFloat(line, 'Rendimentos'),
        withholding: getFloat(line, 'Retencoes'),
        ssPaid: getFloat(line, 'Contribuicoes'),
        unionDues: getFloat(line, 'Quotizacoes'),
      }))
      .filter((line) => line.gross > 0),
  )
}

// ─── Anexo B — Cat B (Self-Employment) ──────────────────────

function parseAnexoB(doc: Document, issues: ValidationIssue[]): ParsedAnexoBRaw[] {
  const results: ParsedAnexoBRaw[] = []
  const anexoBs = findAllElements(doc, 'AnexoB')

  for (const anexoB of anexoBs) {
    // AT XML Quadro03 field pattern:
    // - AnexoBq03C01 = Subject A NIF (ALWAYS, same across all annexes)
    // - AnexoBq03C05 = titular NIF (the actual owner of this Anexo B)
    // Priority: C05 (titular) → id attribute → C01 (fallback for single filer)
    const nif =
      getText(anexoB, 'AnexoBq03C05') ||
      anexoB.getAttribute('id') ||
      getText(anexoB, 'AnexoBq03C01') ||
      ''

    // Q01B01: regime (1=simplified, 2=organized)
    const regimeCode = getInt(anexoB, 'AnexoBq01B01')
    const regime = regimeCode === 2 ? 'organized' : regimeCode === 1 ? 'simplified' : null
    if (!regime && regimeCode) {
      issues.push({
        severity: 'warning',
        code: 'UNKNOWN_REGIME',
        message: `Anexo B: código de regime desconhecido: ${regimeCode}`,
      })
    }

    // Q03: Activity details
    const activityCode = getText(anexoB, 'AnexoBq03C07') || undefined
    const cae = getText(anexoB, 'AnexoBq03C08') || undefined
    const firstYear = getBool(anexoB, 'AnexoBq03B10')

    // Q04: Income by code (C401-C408)
    const incomeByCode: Record<number, number> = {}
    for (const code of CAT_B_INCOME_CODES) {
      const val = getFloat(anexoB, `AnexoBq04C${code}`)
      if (val > 0) incomeByCode[code] = val
    }

    const totalGross = getFloat(anexoB, 'AnexoBq04SomaC01')
    const documentedExpensesSales = getFloat(anexoB, 'AnexoBq04SomaC02')
    const documentedExpensesOther = getFloat(anexoB, 'AnexoBq04SomaC03')

    // Q06: Withholding
    const withholding = getFloat(anexoB, 'AnexoBq06C603')

    // Q13: Summary
    const priorYearIncome = getFloat(anexoB, 'AnexoBq13C1305') || undefined

    results.push({
      nif,
      regime,
      activityCode,
      cae,
      firstYear,
      incomeByCode,
      totalGross,
      documentedExpensesSales,
      documentedExpensesOther,
      withholding,
      priorYearIncome,
    })
  }

  return results
}

// ─── Anexo SS — Social Security ─────────────────────────────

function parseAnexoSS(doc: Document, _issues: ValidationIssue[]): ParsedAnexoSSRaw[] {
  const results: ParsedAnexoSSRaw[] = []
  const anexoSSs = findAllElements(doc, 'AnexoSS')

  for (const anexoSS of anexoSSs) {
    const nif = getText(anexoSS, 'AnexoSSq03C06') || ''
    const niss = getText(anexoSS, 'AnexoSSq03C07') || undefined

    // Q04: Cat B income base for SS
    const incomeByCode: Record<number, number> = {}
    for (const code of CAT_B_INCOME_CODES) {
      const val = getFloat(anexoSS, `AnexoSSq04C4${String(code).padStart(2, '0')}`)
      if (val > 0) incomeByCode[code] = val
    }
    // Also try C406 format (seen in real data as AnexoSSq04C406)
    for (const code of CAT_B_INCOME_CODES) {
      if (!incomeByCode[code]) {
        const val = getFloat(anexoSS, `AnexoSSq04C${code}`)
        if (val > 0) incomeByCode[code] = val
      }
    }

    const catBIncome = getFloat(anexoSS, 'AnexoSSq04C1')
    const otherIncome = getFloat(anexoSS, 'AnexoSSq05C1')

    // Q06: Foreign SS
    const foreignActivity = getBool(anexoSS, 'AnexoSSq06B1') ?? false
    const foreignActivityEntries: ParsedAnexoSSRaw['foreignActivityEntries'] = []
    const ssLines = findAllElements(anexoSS, 'AnexoSSq06T1-Linha')
    for (const line of ssLines) {
      const country = getText(line, 'Pais') || ''
      const foreignNif = getText(line, 'NFiscalEstrangeiro') || ''
      const amount = getFloat(line, 'Valor')
      if (country || amount > 0) {
        foreignActivityEntries.push({ country, foreignNif, amount })
      }
    }

    results.push({
      nif,
      niss,
      catBIncome,
      incomeByCode,
      otherIncome,
      foreignActivity,
      foreignActivityEntries,
    })
  }

  return results
}

// ─── Anexo E — Cat E (Capital Income) ───────────────────────

interface AnexoELine {
  titular: string
  entityNif: string
  incomeCode: number
  gross: number
  withholding: number
  englobamento: boolean
}

function parseAnexoE(doc: Document, _issues: ValidationIssue[]): AnexoELine[] {
  const elines = findAllElements(doc, 'AnexoEq04AT01-Linha')
  return elines
    .map((line) => ({
      titular: getText(line, 'Titular') || 'A',
      entityNif: getText(line, 'NIF') || '',
      incomeCode: getInt(line, 'CodRendimentos') || 0,
      gross: getFloat(line, 'Rendimentos'),
      withholding: getFloat(line, 'Retencoes'),
      englobamento: getBool(line, 'Englobamento') ?? false,
    }))
    .filter((line) => line.gross > 0)
}

// ─── Anexo F — Cat F (Rental Income) ────────────────────────

interface AnexoFLine {
  titular: string
  gross: number
  withholding: number
  expenses: number
  contractDuration?: number
  englobamento: boolean
  propertyRef?: string // Freguesia/Artigo
}

function parseAnexoF(doc: Document, _issues: ValidationIssue[]): AnexoFLine[] {
  return findAllElements(doc, 'AnexoFq04AT01-Linha')
    .map((line) => ({
      titular: getText(line, 'Titular') || 'A',
      gross: getFloat(line, 'Rendimentos') || getFloat(line, 'RendasBrutas'),
      withholding: getFloat(line, 'Retencoes'),
      expenses: getFloat(line, 'Encargos') || getFloat(line, 'Despesas'),
      contractDuration: getInt(line, 'DuracaoContrato') || undefined,
      englobamento: getBool(line, 'Englobamento') ?? false,
      propertyRef: getText(line, 'Artigo') || undefined,
    }))
    .filter((line) => line.gross > 0)
}

// ─── Anexo G — Cat G (Capital Gains) ────────────────────────

interface AnexoGLine {
  titular: string
  assetType: 'real_estate' | 'financial' | 'crypto' | 'other'
  acquisitionValue: number
  saleValue: number
  acquisitionDate?: string
  saleDate?: string
  withholding: number
  englobamento: boolean
}

function parseAnexoG(doc: Document, _issues: ValidationIssue[]): AnexoGLine[] {
  const lines: AnexoGLine[] = []

  // Q04: Real estate gains (always englobamento at 50%)
  for (const line of findAllElements(doc, 'AnexoGq04AT01-Linha')) {
    const saleValue = getFloat(line, 'ValorRealizacao') || getFloat(line, 'ValorAlienacao')
    if (saleValue === 0 && getFloat(line, 'ValorAquisicao') === 0) continue
    lines.push({
      titular: getText(line, 'Titular') || 'A',
      assetType: 'real_estate',
      acquisitionValue: getFloat(line, 'ValorAquisicao'),
      saleValue,
      acquisitionDate: getText(line, 'DataAquisicao') || undefined,
      saleDate: getText(line, 'DataAlienacao') || getText(line, 'DataRealizacao') || undefined,
      withholding: getFloat(line, 'Retencoes'),
      englobamento: true,
    })
  }

  // Q09: Financial assets, Q14: Crypto — share same structure
  const tradableAssetTables: Array<{ element: string; assetType: AnexoGLine['assetType'] }> = [
    { element: 'AnexoGq09AT01-Linha', assetType: 'financial' },
    { element: 'AnexoGq14AT01-Linha', assetType: 'crypto' },
  ]

  for (const { element, assetType } of tradableAssetTables) {
    for (const line of findAllElements(doc, element)) {
      const saleValue = getFloat(line, 'ValorRealizacao') || getFloat(line, 'ValorAlienacao')
      if (saleValue === 0 && getFloat(line, 'ValorAquisicao') === 0) continue
      lines.push({
        titular: getText(line, 'Titular') || 'A',
        assetType,
        acquisitionValue: getFloat(line, 'ValorAquisicao'),
        saleValue,
        acquisitionDate: getText(line, 'DataAquisicao') || undefined,
        saleDate: getText(line, 'DataAlienacao') || getText(line, 'DataRealizacao') || undefined,
        withholding: getFloat(line, 'Retencoes'),
        englobamento: getBool(line, 'Englobamento') ?? false,
      })
    }
  }

  return lines
}

// ─── Anexo H — Deductions & Benefits ────────────────────────

interface AnexoHDeduction {
  category: DeductionCategory
  amount: number
  titular?: string
}

function parseAnexoH(doc: Document, _issues: ValidationIssue[]): AnexoHDeduction[] {
  const deductions: AnexoHDeduction[] = []

  // Simple deduction tables: all share the same Valor/Montante + Titular structure
  const simpleDeductionTables: Array<{ element: string; category: DeductionCategory }> = [
    { element: 'AnexoHq06AAT01-Linha', category: 'alimony' },
    { element: 'AnexoHq06BAT01-Linha', category: 'ppr' },
    { element: 'AnexoHq07AT01-Linha', category: 'housing' },
  ]

  for (const { element, category } of simpleDeductionTables) {
    for (const line of findAllElements(doc, element)) {
      const amount = getFloat(line, 'Valor') || getFloat(line, 'Montante')
      if (amount > 0) {
        deductions.push({ category, amount, titular: getText(line, 'Titular') || undefined })
      }
    }
  }

  // Q06C: Expense corrections — requires type-to-category mapping
  for (const line of findAllElements(doc, 'AnexoHq06CAT01-Linha')) {
    const amount = getFloat(line, 'Valor') || getFloat(line, 'Montante')
    if (amount > 0) {
      const tipo = getText(line, 'Tipo') || getText(line, 'CodDespesa') || ''
      let cat: DeductionCategory = 'general'
      if (tipo.includes('saude') || tipo === '1') cat = 'health'
      else if (tipo.includes('educa') || tipo === '2') cat = 'education'
      else if (tipo.includes('habita') || tipo === '3') cat = 'housing'
      else if (tipo.includes('lar') || tipo === '4') cat = 'care_home'
      deductions.push({ category: cat, amount, titular: getText(line, 'Titular') || undefined })
    }
  }

  return deductions
}

// ─── Anexo J — Foreign Income ───────────────────────────────

interface AnexoJLine {
  titular: string
  category: IncomeCategory
  countryCode: string
  gross: number
  foreignTaxPaid: number
}

const ANEXO_J_TABLES: Array<{ element: string; category: IncomeCategory }> = [
  { element: 'AnexoJq04AAT01-Linha', category: 'A' },
  { element: 'AnexoJq04BAT01-Linha', category: 'B' },
  { element: 'AnexoJq04EAT01-Linha', category: 'E' },
  { element: 'AnexoJq04FAT01-Linha', category: 'F' },
  { element: 'AnexoJq04GAT01-Linha', category: 'G' },
  { element: 'AnexoJq04HAT01-Linha', category: 'H' },
]

function parseAnexoJ(doc: Document): AnexoJLine[] {
  return ANEXO_J_TABLES.flatMap(({ element, category }) =>
    findAllElements(doc, element)
      .map((line) => ({
        titular: getText(line, 'Titular') || 'A',
        category,
        countryCode: getText(line, 'CodPais') || getText(line, 'Pais') || '',
        gross: getFloat(line, 'Rendimentos'),
        foreignTaxPaid: getFloat(line, 'ImpostoPago'),
      }))
      .filter((line) => line.gross > 0),
  )
}

// ─── Anexo L — NHR (Non-Habitual Resident) ──────────────────

interface AnexoLLine {
  titular: string
  incomeCode: number
  gross: number
  withholding: number
  entityNif: string
  activityCode: string
}

function parseAnexoL(doc: Document): AnexoLLine[] {
  const tables = ['AnexoLq04AT01-Linha', 'AnexoLq04BT01-Linha']
  return tables.flatMap((table) =>
    findAllElements(doc, table)
      .map((line) => ({
        titular: getText(line, 'Titular') || 'A',
        incomeCode: getInt(line, 'CodRendimentos') || getInt(line, 'CodRendimento'),
        // Anexo L uses 'Rendimento' (singular), Anexo A uses 'Rendimentos' (plural)
        gross: getFloat(line, 'Rendimentos') || getFloat(line, 'Rendimento'),
        withholding: getFloat(line, 'Retencoes'),
        entityNif: getText(line, 'NIFEntidade') || getText(line, 'NIF') || '',
        activityCode: getText(line, 'CodAtividadeP2019') || '',
      }))
      .filter((line) => line.gross > 0),
  )
}

/**
 * Detect NHR status from Anexo L header (Q03).
 * The person identified by AnexoLq03C03 is the NHR holder.
 *
 * AT XML field pattern in Quadro03:
 * - AnexoLq03C01 = Subject A NIF (ALWAYS, same across all annexes)
 * - AnexoLq03C02 = Subject B NIF
 * - AnexoLq03C03 = NHR titular NIF (the actual owner of the annex)
 * - <AnexoL id="nif"> = also the titular NIF
 *
 * Priority: C03 (titular) → id attribute → C01 (fallback for single filer)
 */
function parseAnexoLNif(doc: Document): string | null {
  const anexoLs = findAllElements(doc, 'AnexoL')
  if (anexoLs.length === 0) return null
  const el = anexoLs[0]
  return getText(el, 'AnexoLq03C03') || el.getAttribute('id') || getText(el, 'AnexoLq03C01') || null
}

// ─── Detect which Anexos are present ────────────────────────

function detectAnexos(doc: Document): string[] {
  const anexos: string[] = []
  const names = [
    'AnexoA',
    'AnexoB',
    'AnexoC',
    'AnexoD',
    'AnexoE',
    'AnexoF',
    'AnexoG',
    'AnexoG1',
    'AnexoH',
    'AnexoI',
    'AnexoJ',
    'AnexoL',
    'AnexoSS',
  ]
  for (const name of names) {
    if (findElement(doc, name)) anexos.push(name)
  }
  return anexos
}

// ─── Main Parser ────────────────────────────────────────────

/**
 * Parse AT Modelo 3 IRS XML declaration into a Household.
 *
 * Comprehensive parser covering:
 * - Rosto: Q02-Q11 (year, NIF, civil status, disability, dependents,
 *   shared custody, godchildren, ascendants, filing option, IBAN)
 * - Anexo A: Cat A employment + Cat H pension income (codes, union dues)
 * - Anexo B: Cat B self-employment (regime, activity code, all income codes,
 *   documented expenses, withholding, prior year income)
 * - Anexo E: Cat E capital income (dividends, interest)
 * - Anexo F: Cat F rental income
 * - Anexo G: Cat G capital gains (real estate, financial, crypto)
 * - Anexo H: Deductions & benefits (alimony, PPR, corrections, housing)
 * - Anexo J: Foreign income (all categories)
 * - Anexo L: NHR regime income
 * - Anexo SS: Social security (Cat B base, foreign SS)
 */
export function parseModelo3Xml(xmlString: string): ParsedXmlResult {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const issues: ValidationIssue[] = []

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent}`)
  }

  // ─── Rosto ──────────────────────────────────────────────
  const rosto = parseRosto(doc, issues)
  const {
    year,
    subjectA_nif,
    subjectA_name,
    civilStatus,
    disabilitySPA,
    disabilitySPB,
    subjectB_nif,
    filingOption,
    iban,
    isJointDeclaration,
  } = rosto

  // Filing status: determined by declaration structure, NOT Q08B01.
  // Joint declaration (Q05B01=S → isJointDeclaration) means both spouses
  // filed together → married_joint. A single-filer XML with spouse NIF
  // (Q06C01) but no Subject B means married_separate.
  const isMarriedOrUnion = civilStatus === 1 || civilStatus === 2
  let filingStatus: FilingStatus = 'single'
  if (isMarriedOrUnion) {
    if (isJointDeclaration) {
      filingStatus = 'married_joint'
    } else if (subjectB_nif) {
      // Has spouse NIF but not a joint declaration → separate filing
      filingStatus = 'married_separate'
    }
  }

  // ─── Members ────────────────────────────────────────────
  const personA: Person = {
    name: subjectA_name,
    nif: subjectA_nif || undefined,
    incomes: [],
    deductions: [],
    special_regimes: [],
    disability_degree: disabilitySPA || undefined,
  }

  // Only create personB for joint declarations where both spouses' data is present.
  // In married_separate, the spouse filed their own declaration — Q06C01 is just a reference.
  const personB: Person | null =
    isMarriedOrUnion && isJointDeclaration && subjectB_nif
      ? {
          name: `Titular B (${subjectB_nif})`,
          nif: subjectB_nif,
          incomes: [],
          deductions: [],
          special_regimes: [],
          disability_degree: disabilitySPB || undefined,
        }
      : null

  // Helper to assign income/deductions to correct person
  function getTarget(titular: string): Person {
    if (titular === 'B' && personB) return personB
    return personA
  }

  // ─── Detect present Anexos ──────────────────────────────
  const anexosPresent = detectAnexos(doc)

  // ─── Anexo A — Cat A + Cat H ────────────────────────────
  const anexoALines = safeParseSection('Anexo A', issues, [] as AnexoALine[], () =>
    parseAnexoA(doc, issues),
  )
  const catAIncomeCodes: ParsedXmlResult['raw']['catAIncomeCodes'] = []

  for (const line of anexoALines) {
    const target = getTarget(line.titular)
    const income: Income = {
      category: line.category,
      gross: line.gross,
      withholding: line.withholding || undefined,
      ss_paid: line.ssPaid || undefined,
      cat_a_code: line.incomeCode,
    }
    target.incomes.push(income)

    // Union dues → sindical deduction
    if (line.unionDues > 0) {
      target.deductions.push({
        category: 'sindical',
        amount: line.unionDues,
      })
    }

    // Track income codes for raw output
    catAIncomeCodes.push({
      titular: line.titular,
      code: line.incomeCode,
      gross: line.gross,
    })

    // IRS Jovem detection: code 417 indicates IRS Jovem qualifying income
    if (line.incomeCode === 417 && !target.special_regimes.includes('irs_jovem')) {
      target.special_regimes.push('irs_jovem')
      issues.push({
        severity: 'warning',
        code: 'IRS_JOVEM_VERIFY',
        message:
          `Código 417 (IRS Jovem) detetado para titular ${line.titular}. ` +
          `Verifique o ano de benefício (irs_jovem_year) manualmente.`,
      })
    }
  }

  // ─── Anexo B — Cat B ────────────────────────────────────
  const parsedAnexoB = safeParseSection('Anexo B', issues, [] as ParsedAnexoBRaw[], () =>
    parseAnexoB(doc, issues),
  )

  for (const ab of parsedAnexoB) {
    const target = personB && ab.nif === subjectB_nif ? personB : personA

    // Create one Income per income code for accurate coefficient handling
    const codes = Object.keys(ab.incomeByCode).map(Number)

    // Infer activity start year for Art. 31 nº 10 reduction:
    // - firstYear=true AND no prior income → started this year (confident)
    // - Otherwise: leave undefined — questionnaire asks the user
    if (ab.firstYear && !ab.priorYearIncome) {
      target.cat_b_start_year = year
    }

    if (codes.length > 0) {
      for (const code of codes) {
        const gross = ab.incomeByCode[code]
        const income: Income = {
          category: 'B',
          gross,
          cat_b_regime: ab.regime || 'simplified',
          cat_b_income_code: code,
          cat_b_activity_code: ab.activityCode,
          cat_b_cae: ab.cae,
          withholding: undefined, // withholding is total, allocated proportionally
        }

        // Allocate withholding proportionally across codes
        if (ab.withholding > 0 && ab.totalGross > 0) {
          income.withholding = Math.round(ab.withholding * (gross / ab.totalGross) * 100) / 100
        }

        // Documented expenses (total across all codes)
        const totalDocExpenses = ab.documentedExpensesSales + ab.documentedExpensesOther
        if (totalDocExpenses > 0) {
          // Allocate proportionally
          income.cat_b_documented_expenses =
            Math.round(totalDocExpenses * (gross / ab.totalGross) * 100) / 100
        }

        target.incomes.push(income)
      }
    } else if (ab.totalGross > 0) {
      // No specific codes found, use total
      target.incomes.push({
        category: 'B',
        gross: ab.totalGross,
        cat_b_regime: ab.regime || 'simplified',
        cat_b_activity_code: ab.activityCode,
        cat_b_cae: ab.cae,
        withholding: ab.withholding || undefined,
        cat_b_documented_expenses:
          ab.documentedExpensesSales + ab.documentedExpensesOther || undefined,
      })
    }
  }

  // ─── Anexo E — Cat E ────────────────────────────────────
  const anexoELines = safeParseSection('Anexo E', issues, [] as AnexoELine[], () =>
    parseAnexoE(doc, issues),
  )
  for (const line of anexoELines) {
    getTarget(line.titular).incomes.push({
      category: 'E',
      gross: line.gross,
      withholding: line.withholding || undefined,
      englobamento: line.englobamento,
    })
  }

  // ─── Anexo F — Cat F ────────────────────────────────────
  const anexoFLines = safeParseSection('Anexo F', issues, [] as AnexoFLine[], () =>
    parseAnexoF(doc, issues),
  )
  for (const line of anexoFLines) {
    getTarget(line.titular).incomes.push({
      category: 'F',
      gross: line.gross,
      withholding: line.withholding || undefined,
      expenses: line.expenses || undefined,
      rental_contract_duration: line.contractDuration,
      englobamento: line.englobamento,
    })
  }

  // ─── Anexo G — Cat G ────────────────────────────────────
  const anexoGLines = safeParseSection('Anexo G', issues, [] as AnexoGLine[], () =>
    parseAnexoG(doc, issues),
  )
  for (const line of anexoGLines) {
    const gain = line.saleValue - line.acquisitionValue
    getTarget(line.titular).incomes.push({
      category: 'G',
      gross: gain,
      withholding: line.withholding || undefined,
      asset_type: line.assetType,
      englobamento: line.englobamento,
    })
  }

  // ─── Anexo H — Deductions ──────────────────────────────
  const anexoHDeductions = safeParseSection('Anexo H', issues, [] as AnexoHDeduction[], () =>
    parseAnexoH(doc, issues),
  )
  for (const ded of anexoHDeductions) {
    const target = ded.titular ? getTarget(ded.titular) : personA
    target.deductions.push({
      category: ded.category,
      amount: ded.amount,
    })
  }

  // ─── Anexo J — Foreign Income ──────────────────────────
  const anexoJLines = safeParseSection('Anexo J', issues, [] as AnexoJLine[], () =>
    parseAnexoJ(doc),
  )
  for (const line of anexoJLines) {
    getTarget(line.titular).incomes.push({
      category: line.category,
      gross: line.gross,
      country_code: line.countryCode,
      foreign_tax_paid: line.foreignTaxPaid || undefined,
    })
  }
  if (anexoJLines.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'FOREIGN_INCOME',
      message:
        `${anexoJLines.length} rendimento(s) estrangeiro(s) detetados (Anexo J). ` +
        `O crédito por dupla tributação (Art. 81) pode não ser totalmente calculado.`,
    })
  }

  // ─── Anexo L — NHR ─────────────────────────────────────
  // Detect NHR status from Anexo L header (independent of income lines)
  const anexoLNif = safeParseSection('Anexo L (NIF)', issues, null as string | null, () =>
    parseAnexoLNif(doc),
  )
  if (anexoLNif) {
    const nhrTarget = personB && anexoLNif === subjectB_nif ? personB : personA
    if (!nhrTarget.special_regimes.includes('nhr')) {
      nhrTarget.special_regimes.push('nhr')
    }
    // Anexo L present = NHR is confirmed active for this tax year
    nhrTarget.nhr_confirmed = true
  }

  // Anexo L income lines belong to the NHR holder (identified by anexoLNif).
  // Anexo L lines NEVER have <Titular> tags, so we route by the annex owner.
  // Only add income if the person has no Cat A/H income yet (Anexo L often
  // duplicates Anexo A).
  const anexoLLines = safeParseSection('Anexo L', issues, [] as AnexoLLine[], () =>
    parseAnexoL(doc),
  )
  for (const line of anexoLLines) {
    // Route to NHR holder if known, otherwise fall back to line.titular
    const target = anexoLNif
      ? personB && anexoLNif === subjectB_nif
        ? personB
        : personA
      : getTarget(line.titular)
    const hasCatAIncome = target.incomes.some((i) => i.category === 'A' || i.category === 'H')
    if (!hasCatAIncome) {
      target.incomes.push({
        category: 'A',
        gross: line.gross,
        withholding: line.withholding || undefined,
      })
    }
    if (!target.special_regimes.includes('nhr')) {
      target.special_regimes.push('nhr')
    }
    if (!target.nhr_confirmed) {
      target.nhr_confirmed = true
    }
  }

  // ─── Anexo SS — Social Security ────────────────────────
  const parsedAnexoSS = safeParseSection('Anexo SS', issues, [] as ParsedAnexoSSRaw[], () =>
    parseAnexoSS(doc, issues),
  )
  for (const ss of parsedAnexoSS) {
    if (ss.foreignActivity && ss.foreignActivityEntries.length > 0) {
      issues.push({
        severity: 'info',
        code: 'FOREIGN_ACTIVITY',
        message:
          `Atividade exercida no estrangeiro declarada no Anexo SS para NIF ${ss.nif} ` +
          `(${ss.foreignActivityEntries.map((e) => `país ${e.country}: €${e.amount}`).join(', ')}). ` +
          `Se sujeito ao regime de SS do país estrangeiro, o cálculo de SS português pode não se aplicar.`,
      })
    }
  }

  // ─── Dependents ─────────────────────────────────────────
  const allDeps: ParsedDependentRaw[] = [
    ...rosto.dependents,
    ...rosto.sharedCustodyDependents,
    ...rosto.godchildren,
  ]

  const dependents: Dependent[] = allDeps.map((d, i) => {
    const isShared = d.sharedCustody ?? false
    const source = rosto.sharedCustodyDependents.includes(d)
      ? ' (guarda conjunta)'
      : rosto.godchildren.includes(d)
        ? ' (afilhado civil)'
        : ''
    return {
      name: `Dependente ${i + 1} (${d.nif})${source}`,
      // XML doesn't contain birth years — default to age 10 (standard €600
      // deduction, no special benefits). Questionnaire lets user override.
      birth_year: rosto.year - 10,
      shared_custody: isShared,
      disability_degree: d.disabilityDegree,
    }
  })

  // ─── Ascendants ─────────────────────────────────────────
  const ascendants: Ascendant[] = rosto.ascendants.map((a, i) => ({
    name: `Ascendente ${i + 1} (${a.nif})`,
    income: a.income,
    disability_degree: a.disabilityDegree,
  }))

  // ─── Validate ──────────────────────────────────────────
  if (personA.incomes.length === 0 && (!personB || personB.incomes.length === 0)) {
    issues.push({
      severity: 'warning',
      code: 'NO_INCOME',
      message: 'Nenhum rendimento encontrado no XML. Verifique se o ficheiro está completo.',
    })
  }

  // Report unparsed Anexos
  const SUPPORTED_ANEXOS = new Set([
    'AnexoA',
    'AnexoB',
    'AnexoE',
    'AnexoF',
    'AnexoG',
    'AnexoH',
    'AnexoJ',
    'AnexoL',
    'AnexoSS',
  ])
  const unparsedAnexos = anexosPresent.filter((a) => !SUPPORTED_ANEXOS.has(a))
  if (unparsedAnexos.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'UNSUPPORTED_ANEXO',
      message:
        `Anexo(s) presente(s) mas não totalmente processados: ${unparsedAnexos.join(', ')}. ` +
        `Os dados destes anexos podem não estar refletidos na análise.`,
    })
  }

  // ─── Build Household ───────────────────────────────────
  const members: Person[] = [personA]
  if (personB) members.push(personB)

  const household: Household = {
    year,
    filing_status: filingStatus,
    members,
    dependents,
    ascendants: ascendants.length > 0 ? ascendants : [],
  }

  return {
    household,
    raw: {
      subjectA_nif,
      subjectA_name,
      subjectB_nif,
      year,
      civilStatus,
      englobamento: false, // deprecated — Q05B01 is disability, not englobamento
      disabilitySPA,
      disabilitySPB,
      filingOption,
      dependents: allDeps,
      godchildren: rosto.godchildren,
      ascendants: rosto.ascendants,
      anexoB: parsedAnexoB,
      anexoSS: parsedAnexoSS,
      catAIncomeCodes,
      anexosPresent,
      iban,
      isJointDeclaration: rosto.isJointDeclaration,
    },
    issues,
  }
}
