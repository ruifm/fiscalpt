// ─── Filing & Household ───────────────────────────────────────

export type FilingStatus = 'single' | 'married_joint' | 'married_separate'

export type IncomeCategory = 'A' | 'B' | 'E' | 'F' | 'G' | 'H'

export type DeductionCategory =
  | 'general'
  | 'health'
  | 'education'
  | 'housing'
  | 'care_home'
  | 'ppr'
  | 'alimony'
  | 'fatura' // Art. 78-F: 15% of VAT on qualifying invoices
  | 'trabalho_domestico' // Domestic worker expenses
  | 'disability_rehab' // Art. 87 nº 3: disability education/rehabilitation (30%, no cap)
  | 'disability_insurance' // Art. 87 nº 4: life/disability insurance (25%, cap 15% of coleta)
  | 'sindical' // Union dues (quotizações sindicais)

export type SpecialRegime = 'nhr' | 'irs_jovem'

export interface Income {
  category: IncomeCategory
  gross: number
  withholding?: number
  ss_paid?: number

  // Cat A: income subcode from Anexo A (401=wages, 402=public, etc.)
  cat_a_code?: number
  // Cat A: union dues (quotizações sindicais) — deducted as sindical
  union_dues?: number

  // Cat B: accounting regime (default: 'simplified')
  cat_b_regime?: 'simplified' | 'organized'
  // Cat B simplified: income code (401-408) — determines coefficient
  cat_b_income_code?: number
  // Cat B organized / Cat F: documented expenses
  expenses?: number
  // Cat B simplified: total documented expenses for Art. 31 nº 13 acréscimo
  // If < 15% of gross, difference is added to taxable income.
  // Includes SS contributions + e-fatura expenses.
  cat_b_documented_expenses?: number
  // Cat B simplified — Art. 31 nº 10: which year of new activity (1 or 2).
  // Y1: only 50% of simplified income is taxable.
  // Y2: only 75% of simplified income is taxable.
  // undefined/0: no reduction (normal activity or ineligible).
  cat_b_activity_year?: number
  // Cat B: activity code (tabela de atividades) from AnexoBq03C07
  cat_b_activity_code?: string
  // Cat B: CAE from AnexoBq03C08
  cat_b_cae?: string

  // Cat E/F/G: opt to aggregate into progressive brackets (default: false → autonomous)
  englobamento?: boolean

  // Cat F: long-term rental contract duration in years (for reduced autonomous rates)
  rental_contract_duration?: number

  // Cat G: asset type for different taxation rules
  // real_estate: 50% mandatory aggregation into progressive brackets
  // financial: 28% autonomous (default) or englobamento
  // crypto: 28% if held <365 days (2023+), exempt if ≥365 days or pre-2023
  asset_type?: 'real_estate' | 'financial' | 'crypto' | 'other'

  // Anexo J: foreign income
  country_code?: string // ISO country code or AT country code
  foreign_tax_paid?: number // tax already paid abroad (for Art. 81 double taxation credit)
}

export interface Deduction {
  category: DeductionCategory
  amount: number
}

export interface Dependent {
  name: string
  birth_year: number
  // Shared custody (guarda conjunta / residência alternada): deduction is
  // split 50/50 between parents. Also applies to married-separate filing
  // where both spouses declare the dependent.
  shared_custody?: boolean
  // Disability degree (grau de incapacidade) ≥ 60% for tax benefits.
  // Triggers Art. 87 deductions (2.5 × IAS per disabled dependent).
  disability_degree?: number
}

// ─── Ascendants ───────────────────────────────────────────────
// Art. 78-A nº 1.c / nº 2.b — ascendants living with taxpayer

export interface Ascendant {
  name: string
  birth_year?: number
  // Annual income — must be ≤ pension minimum for eligibility
  income?: number
  // Disability degree (≥ 60% triggers Art. 87 deductions)
  disability_degree?: number
}

export interface Person {
  name: string
  nif?: string
  birth_year?: number // needed for PPR age-based caps
  incomes: Income[]
  deductions: Deduction[]
  special_regimes: SpecialRegime[]
  irs_jovem_year?: number // 1-10: which year of benefit
  nhr_start_year?: number
  // Set when Anexo L is present — NHR is definitively active for this tax year
  nhr_confirmed?: boolean
  // Disability degree (grau de incapacidade) ≥ 60% for tax benefits.
  // Triggers Art. 87 deductions (4 × IAS), companion (4 × IAS if ≥ 90%).
  disability_degree?: number
}

export interface Household {
  year: number
  filing_status: FilingStatus
  members: Person[]
  dependents: Dependent[]
  ascendants?: Ascendant[]
  projected?: boolean
}

// ─── Tax Bracket Definition ───────────────────────────────────

export interface TaxBracket {
  upper_limit: number // Infinity for the last bracket
  rate: number // decimal, e.g. 0.13 for 13%
}

// ─── Computation Results ──────────────────────────────────────

export interface PersonTaxDetail {
  name: string
  gross_income: number
  taxable_income: number // income going to progressive brackets
  irs_before_deductions: number
  deductions_total: number
  irs_after_deductions: number
  autonomous_tax: number // Cat E/F/G autonomous taxation (flat rates)
  solidarity_surcharge: number // Art. 68-A CIRS — high income surcharge
  specific_deduction: number // Cat A (Art. 25) / Cat H (Art. 53)
  cat_b_acrescimo: number // Art. 31 nº 13 — minimum expense shortfall
  double_taxation_credit: number // Art. 81 CIRS — credit for foreign tax paid
  ss_total: number
  withholding_total: number
  irs_jovem_exemption: number
  nhr_tax: number
  minimo_existencia_applied: boolean
  effective_rate_irs: number // (progressive + autonomous + nhr) / gross
  effective_rate_total: number // (all tax + SS) / gross
  // Deduction breakdown
  dependent_deduction_share: number // share of dependent deductions for this person
  ascendant_deduction_share: number // share of ascendant deductions for this person
  disability_deductions: number // Art. 87 disability deductions for this person
}

export interface ScenarioResult {
  label: string
  filing_status: FilingStatus
  persons: PersonTaxDetail[]
  total_gross: number
  total_taxable: number
  total_irs: number
  total_ss: number
  total_deductions: number
  total_tax_burden: number
  total_net: number
  effective_rate_irs: number
  effective_rate_total: number
}

export interface Optimization {
  id: string
  title: string
  description: string
  estimated_savings: number
}

export interface AnalysisResult {
  year: number
  household: Household
  scenarios: ScenarioResult[]
  recommended_scenario: string
  optimizations: Optimization[]
  joint_vs_separate_savings?: number
  irs_jovem_savings?: number
  nhr_savings?: number
}

// ─── Validation ───────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: ValidationSeverity
  code: string // machine-readable, e.g. 'UNSUPPORTED_ANEXO'
  message: string // Portuguese user-facing message
  details?: string // optional technical details
}

// ─── Constants ────────────────────────────────────────────────

/**
 * Look up a value in a year-keyed record with fallback.
 * If exact year not found, uses nearest available year (latest for future, earliest for past).
 */
function lookupByYear(table: Record<number, number>, year: number): number {
  if (table[year] !== undefined) return table[year]
  const years = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b)
  if (year > years[years.length - 1]) return table[years[years.length - 1]]
  return table[years[0]]
}

export const IAS: Record<number, number> = {
  2021: 438.81,
  2022: 443.2,
  2023: 480.43,
  2024: 509.26,
  2025: 522.5,
}

export function getIas(year: number): number {
  return lookupByYear(IAS, year)
}

// Retribuição Mínima Mensal Garantida (minimum wage)
export const RMMG: Record<number, number> = {
  2021: 665.0,
  2022: 705.0,
  2023: 760.0,
  2024: 820.0,
  2025: 870.0,
}

export function getRmmg(year: number): number {
  return lookupByYear(RMMG, year)
}

// Art. 70 CIRS — Mínimo de existência
// Net income after IRS cannot be below this threshold.
// Formula: max(1.5 × 14 × IAS, 14 × RMMG) for each year
// Only applies when income is predominantly (>50%) from Cat A, B, or H
export const MINIMO_EXISTENCIA: Record<number, number> = {
  2021: 9310.0, // 14 × €665
  2022: 9870.0, // 14 × €705
  2023: 10640.0, // 14 × €760
  2024: 11480.0, // 14 × €820
  2025: 12180.0, // 14 × €870
}

export function getMinimoExistencia(year: number): number {
  return lookupByYear(MINIMO_EXISTENCIA, year)
}

// Art. 25 CIRS (Cat A) / Art. 53 CIRS (Cat H) — specific deduction
// taxable = gross - max(SPECIFIC_DEDUCTION, SS_contributions)
// Updated by Lei 32/2024 to be IAS-indexed from 2024 onwards.
export const SPECIFIC_DEDUCTION_BY_YEAR: Record<number, number> = {
  2021: 4104.0,
  2022: 4104.0,
  2023: 4104.0,
  2024: 4350.24, // Lei 32/2024: 8.54 × IAS 2024
  2025: 4462.15, // 8.54 × IAS 2025 (€522.50)
}

export function getSpecificDeduction(year: number): number {
  return lookupByYear(SPECIFIC_DEDUCTION_BY_YEAR, year)
}

/** @deprecated Remove in next major — use getSpecificDeduction(year) */
export const SPECIFIC_DEDUCTION = 4104
/** @deprecated Remove in next major — use getSpecificDeduction(year) */
export const CAT_A_SPECIFIC_DEDUCTION = SPECIFIC_DEDUCTION

// Cat B simplified regime (Art. 31 CIRS)
export const CAT_B_COEFFICIENT = 0.75
export const CAT_B_MIN_EXPENSE_RATIO = 0.15

// Art. 31 nº 1 — coefficients per income code.
// The taxable portion = coefficient × gross.
// code 403 (services) is the most common (0.75).
export const CAT_B_COEFFICIENTS: Record<number, number> = {
  401: 0.15, // Vendas de mercadorias (sale of merchandise)
  402: 0.15, // Vendas de produtos (sale of products)
  403: 0.75, // Prestação de serviços (professional/business services)
  404: 0.95, // Rendimentos de propriedade intelectual (IP income — aggregated)
  405: 0.35, // Rendimentos de propriedade intelectual (IP — not aggregated)
  406: 0.1, // Subsídios destinados à exploração (operating subsidies)
  407: 0.15, // Atividades hoteleiras e restauração (hotel/restaurant)
  408: 0.15, // Vendas de produtos agrícolas (agriculture products)
}

/**
 * Get the simplified regime coefficient for a Cat B income code.
 * Defaults to 0.75 (services) if code unknown.
 */
export function getCatBCoefficient(incomeCode?: number): number {
  if (incomeCode === undefined) return CAT_B_COEFFICIENT
  return CAT_B_COEFFICIENTS[incomeCode] ?? CAT_B_COEFFICIENT
}

// Art. 31 nº 10 — coefficient reduction for first years of Cat B activity.
// Applies when opening activity for the first time or after 5+ years of inactivity.
// Factor applied to the simplified income (coefficient × gross × factor).
export const CAT_B_NEW_ACTIVITY_FACTORS: Record<number, number> = {
  1: 0.5, // 1st full period: 50% of simplified income taxable
  2: 0.75, // 2nd full period: 75% of simplified income taxable
}

// Autonomous taxation rates (Art. 72 CIRS)
export const AUTONOMOUS_RATE_CAT_E = 0.28 // Capital income
export const AUTONOMOUS_RATE_CAT_F = 0.28 // Rental income (standard)
export const AUTONOMOUS_RATE_CAT_G = 0.28 // Capital gains (financial)

// Cat F reduced rates for long-term rental contracts (Lei 3/2019, stable 2021-2025)
export const CAT_F_REDUCED_RATES: { minYears: number; rate: number }[] = [
  { minYears: 20, rate: 0.1 },
  { minYears: 10, rate: 0.14 },
  { minYears: 5, rate: 0.23 },
  { minYears: 2, rate: 0.26 },
]

// Cat G real estate: only 50% of gain is taxed (mandatory aggregation)
export const CAT_G_REAL_ESTATE_INCLUSION_RATE = 0.5

// Taxa Adicional de Solidariedade (Art. 68-A CIRS)
// Applies to rendimento coletável above these thresholds.
// Stable from 2016 through 2025.
export const SOLIDARITY_SURCHARGE_BRACKETS: { lower: number; upper: number; rate: number }[] = [
  { lower: 80000, upper: 250000, rate: 0.025 },
  { lower: 250000, upper: Infinity, rate: 0.05 },
]

// Social Security
export const SS_EMPLOYEE_RATE = 0.11
export const SS_EMPLOYER_RATE = 0.2375
export const SS_INDEPENDENT_BASE_RATIO = 0.7
export const SS_INDEPENDENT_RATE = 0.214
export const SS_INDEPENDENT_REDUCTION = 0.75

// ─── Pensão Mínima (Regime Geral) ─────────────────────────────
// Annual minimum pension (< 15 years contributions).
// Used for ascendant deduction eligibility (Art. 78-A nº 1.c).
export const PENSAO_MINIMA_ANUAL: Record<number, number> = {
  2021: 3303.6, // €275.30 × 12
  2022: 3336.6, // €278.05 × 12
  2023: 3497.76, // €291.48 × 12
  2024: 3833.88, // €319.49 × 12
  2025: 3981.48, // €331.79 × 12
}

export function getPensaoMinimaAnual(year: number): number {
  return lookupByYear(PENSAO_MINIMA_ANUAL, year)
}

// ─── Art. 78-A — Ascendant Deductions ─────────────────────────
// nº 1.c: €525 per ascendant (living with taxpayer, income ≤ pensão mínima)
// nº 2.b: +€110 if only 1 ascendant (total = €635)
export const ASCENDANT_DEDUCTION_BASE = 525
export const ASCENDANT_DEDUCTION_SINGLE_BONUS = 110 // when only 1 ascendant

// ─── Art. 87 — Disability Deductions ──────────────────────────
// Requires disability degree ≥ 60% (atestado multiusos).
// nº 1: Per disabled taxpayer (sujeito passivo): 4 × IAS
// nº 2: Per disabled dependent/ascendant: 2.5 × IAS
// nº 3: 30% of education/rehabilitation expenses, NO cap
// nº 4: 25% of life insurance premiums, cap 15% of coleta
// nº 5: Per person with disability ≥ 90%: 4 × IAS (companion)
export const DISABILITY_TAXPAYER_IAS_MULTIPLIER = 4
export const DISABILITY_DEPENDENT_IAS_MULTIPLIER = 2.5
export const DISABILITY_COMPANION_IAS_MULTIPLIER = 4 // disability ≥ 90%
export const DISABILITY_COMPANION_THRESHOLD = 90 // degree threshold for companion deduction
export const DISABILITY_MIN_DEGREE = 60 // minimum degree for any disability benefit

// ─── Art. 78-F — Fatura (Invoice) Deduction ──────────────────
// 15% of VAT on qualifying invoices (auto repair, restaurants, hairdressers, vets, etc.)
// Cap: €250 per household (stable 2021-2025)
export const FATURA_DEDUCTION_RATE = 0.15
export const FATURA_DEDUCTION_CAP = 250
