import type { Ascendant, Deduction, Dependent, Person } from './types'
import {
  ASCENDANT_DEDUCTION_BASE,
  ASCENDANT_DEDUCTION_SINGLE_BONUS,
  DISABILITY_COMPANION_IAS_MULTIPLIER,
  DISABILITY_COMPANION_THRESHOLD,
  DISABILITY_DEPENDENT_IAS_MULTIPLIER,
  DISABILITY_MIN_DEGREE,
  DISABILITY_TAXPAYER_IAS_MULTIPLIER,
  FATURA_DEDUCTION_CAP,
  FATURA_DEDUCTION_RATE,
  getIas,
  getPensaoMinimaAnual,
} from './types'
import { round2 } from './utils'

// ─── Deduction Caps ───────────────────────────────────────────

export interface DeductionConfig {
  rate: number
  cap: number
}

// Default caps (2021-2024)
const DEDUCTION_CAPS_DEFAULT: Record<string, DeductionConfig> = {
  general: { rate: 0.35, cap: 250 },
  health: { rate: 0.15, cap: 1000 },
  education: { rate: 0.3, cap: 800 },
  housing: { rate: 0.15, cap: 502 },
  care_home: { rate: 0.25, cap: 403.75 },
  ppr: { rate: 0.2, cap: 400 }, // default cap (age <35)
  alimony: { rate: 1.0, cap: Infinity }, // fully deductible, no cap
  fatura: { rate: FATURA_DEDUCTION_RATE, cap: FATURA_DEDUCTION_CAP },
  trabalho_domestico: { rate: 1.0, cap: Infinity }, // full amount, no specific cap
  disability_rehab: { rate: 0.3, cap: Infinity }, // Art. 87 nº 3: 30%, no cap
  disability_insurance: { rate: 0.25, cap: Infinity }, // Art. 87 nº 4: 25%, cap applied separately (15% of coleta)
  sindical: { rate: 1.0, cap: Infinity }, // fully deductible
}

// PPR age-based caps (Art. 21 nº 3 EBF)
// Under 35: €400, 35-50: €350, Over 50: €300
export function getPprCap(birthYear?: number, taxYear: number = 2025): number {
  if (!birthYear) return 400 // default to under-35 cap
  const age = taxYear - birthYear
  if (age < 35) return 400
  if (age <= 50) return 350
  return 300
}

// Year-specific overrides
const DEDUCTION_CAPS_BY_YEAR: Record<number, Partial<Record<string, DeductionConfig>>> = {
  2025: {
    housing: { rate: 0.15, cap: 800 }, // Increased from €502 to €800 in OE 2025
  },
}

export function getDeductionConfig(
  category: string,
  taxYear: number,
  birthYear?: number,
): DeductionConfig | undefined {
  // PPR has age-based caps
  if (category === 'ppr') {
    return { rate: 0.2, cap: getPprCap(birthYear, taxYear) }
  }

  const yearOverrides = DEDUCTION_CAPS_BY_YEAR[taxYear]
  if (yearOverrides && yearOverrides[category]) {
    return yearOverrides[category]
  }
  return DEDUCTION_CAPS_DEFAULT[category]
}

/**
 * Compute deduction amount for a given category and year.
 * Returns the min of (amount × rate, cap).
 */
export function computeDeduction(
  deduction: Deduction,
  taxYear: number = 2025,
  birthYear?: number,
): number {
  const config = getDeductionConfig(deduction.category, taxYear, birthYear)
  if (!config) return 0

  const computed = deduction.amount * config.rate
  return round2(Math.min(computed, config.cap))
}

/**
 * Compute total deductions for a list of deductions (per person).
 * Applies category caps individually.
 * birthYear is needed for PPR age-based caps.
 */
export function computePersonDeductions(
  deductions: Deduction[],
  taxYear: number = 2025,
  birthYear?: number,
): number {
  // Group by category to apply per-category caps
  const byCategory: Record<string, number> = {}

  for (const d of deductions) {
    if (!byCategory[d.category]) {
      byCategory[d.category] = 0
    }
    byCategory[d.category] += d.amount
  }

  let total = 0
  for (const [category, amount] of Object.entries(byCategory)) {
    const config = getDeductionConfig(category, taxYear, birthYear)
    if (!config) continue
    const computed = amount * config.rate
    total += Math.min(computed, config.cap)
  }

  return round2(total)
}

// ─── Dependent Deductions (Art. 78-A nº 1-4) ─────────────────

/**
 * Compute dependent deduction for IRS (Art. 78-A CIRS).
 *
 * Values per dependent (validated against AT liquidação 2021-2024):
 *   - Age ≤ 3 (at 31 Dec): €726 (nº 1.a + nº 2.a: €600 + €126)
 *   - Age 3-6 (at 31 Dec): €726 (includes nº 2/3 age bonus)
 *   - Age > 6: €600
 *
 * For 2nd+ dependents ≤ 6yo (from 2023, nº 3):
 *   - ≤ 3: €900 (€600 + €300, non-cumulative with nº 2)
 *   - 4-6: €900 (€600 + €300)
 *
 * Shared custody: all values halved.
 */
export function computeDependentDeduction(dependent: Dependent, taxYear: number): number {
  const age = taxYear - dependent.birth_year
  let base: number
  if (age < 3) base = 900
  else if (age <= 6) base = 726
  else base = 600
  // Shared custody: deduction split 50/50 between parents
  if (dependent.shared_custody) base = base / 2
  return base
}

/**
 * Compute total dependent deductions for the household.
 */
export function computeTotalDependentDeductions(dependents: Dependent[], taxYear: number): number {
  return dependents.reduce((sum, dep) => sum + computeDependentDeduction(dep, taxYear), 0)
}

// ─── Ascendant Deductions (Art. 78-A nº 1.c / nº 2.b) ────────

/**
 * Check if an ascendant is eligible for deduction.
 * Must live with taxpayer and have income ≤ pension minimum.
 */
export function isAscendantEligible(ascendant: Ascendant, taxYear: number): boolean {
  const pensionMin = getPensaoMinimaAnual(taxYear)
  if (ascendant.income !== undefined && ascendant.income > pensionMin) {
    return false
  }
  return true
}

/**
 * Compute total ascendant deductions for the household.
 * Art. 78-A nº 1.c: €525 per eligible ascendant.
 * Art. 78-A nº 2.b: +€110 if only 1 eligible ascendant (total €635).
 */
export function computeTotalAscendantDeductions(ascendants: Ascendant[], taxYear: number): number {
  const eligible = ascendants.filter((a) => isAscendantEligible(a, taxYear))
  if (eligible.length === 0) return 0
  if (eligible.length === 1) return ASCENDANT_DEDUCTION_BASE + ASCENDANT_DEDUCTION_SINGLE_BONUS
  return eligible.length * ASCENDANT_DEDUCTION_BASE
}

// ─── Disability Deductions (Art. 87 CIRS) ─────────────────────

/**
 * Compute Art. 87 disability deductions for a person.
 *
 * Returns the total disability deduction for the taxpayer:
 * - nº 1: 4 × IAS per disabled taxpayer (disability ≥ 60%)
 * - nº 5: 4 × IAS companion if disability ≥ 90%
 *
 * Note: disability_rehab and disability_insurance are handled
 * through the standard Deduction mechanism.
 */
export function computePersonDisabilityDeduction(person: Person, taxYear: number): number {
  const ias = getIas(taxYear)
  let total = 0

  if (person.disability_degree !== undefined && person.disability_degree >= DISABILITY_MIN_DEGREE) {
    // nº 1: 4 × IAS per disabled taxpayer
    total += DISABILITY_TAXPAYER_IAS_MULTIPLIER * ias
    // nº 5: companion if ≥ 90%
    if (person.disability_degree >= DISABILITY_COMPANION_THRESHOLD) {
      total += DISABILITY_COMPANION_IAS_MULTIPLIER * ias
    }
  }

  return round2(total)
}

/**
 * Compute Art. 87 disability deductions for dependents.
 * nº 2: 2.5 × IAS per disabled dependent (disability ≥ 60%).
 */
export function computeDependentDisabilityDeductions(
  dependents: Dependent[],
  taxYear: number,
): number {
  const ias = getIas(taxYear)
  let total = 0

  for (const dep of dependents) {
    if (dep.disability_degree !== undefined && dep.disability_degree >= DISABILITY_MIN_DEGREE) {
      let amount = DISABILITY_DEPENDENT_IAS_MULTIPLIER * ias
      // Shared custody: halve the disability deduction too
      if (dep.shared_custody) amount = amount / 2
      total += amount
    }
  }

  return round2(total)
}

/**
 * Compute Art. 87 disability deductions for ascendants.
 * nº 2: 2.5 × IAS per disabled ascendant (disability ≥ 60%, must be eligible).
 */
export function computeAscendantDisabilityDeductions(
  ascendants: Ascendant[],
  taxYear: number,
): number {
  const ias = getIas(taxYear)
  let total = 0

  for (const asc of ascendants) {
    if (
      isAscendantEligible(asc, taxYear) &&
      asc.disability_degree !== undefined &&
      asc.disability_degree >= DISABILITY_MIN_DEGREE
    ) {
      total += DISABILITY_DEPENDENT_IAS_MULTIPLIER * ias
    }
  }

  return round2(total)
}
