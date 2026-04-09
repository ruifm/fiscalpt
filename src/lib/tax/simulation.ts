import type {
  Household,
  Person,
  Income,
  Deduction,
  Dependent,
  AnalysisResult,
  FilingStatus,
  SpecialRegime,
} from './types'
import { analyzeHousehold } from './calculator'
import { isEligibleForIrsJovem } from './irs-jovem'


// ─── Simulation Input Types ──────────────────────────────────

export interface SimulationPersonInput {
  birth_year: number
  gross_cat_a: number
  /** Optional Cat B income (simplified regime, services code 1519) */
  gross_cat_b?: number
  /** NHR toggle — assume active if checked */
  nhr?: boolean
}

export interface SimulationInputs {
  married: boolean
  persons: SimulationPersonInput[] // 1 for single, 2 for married
  /** Dependents by age bracket */
  dependents_under_3: number
  dependents_3_to_6: number
  dependents_over_6: number
}

export interface SimulationResults {
  /** "Current" scenario — conservative defaults, no IRS Jovem */
  current: AnalysisResult
  /** "Optimized" scenario — IRS Jovem applied, optimal filing, proactive recommendations */
  optimized: AnalysisResult
  /** Savings from switching to optimized (current best burden - optimized best burden) */
  total_savings: number
}

// ─── Constants ───────────────────────────────────────────────

const TAX_YEAR = 2025
const DEFAULT_GENERAL_DEDUCTION = 250

// Synthetic dependent birth years for each age bracket
const DEPENDENT_BIRTH_YEAR_UNDER_3 = TAX_YEAR - 1 // age 1
const DEPENDENT_BIRTH_YEAR_3_TO_6 = TAX_YEAR - 4 // age 4
const DEPENDENT_BIRTH_YEAR_OVER_6 = TAX_YEAR - 8 // age 8

// IRS Jovem first-work-year inference thresholds
const YOUNG_AGE_THRESHOLD = 25
const YOUNG_START_AGE = 18
const OLDER_START_AGE = 23

// ─── Household Builder ───────────────────────────────────────

function buildDependents(inputs: SimulationInputs): Dependent[] {
  const dependents: Dependent[] = []
  for (let i = 0; i < inputs.dependents_under_3; i++) {
    dependents.push({
      name: `Dependente ${dependents.length + 1}`,
      birth_year: DEPENDENT_BIRTH_YEAR_UNDER_3,
    })
  }
  for (let i = 0; i < inputs.dependents_3_to_6; i++) {
    dependents.push({
      name: `Dependente ${dependents.length + 1}`,
      birth_year: DEPENDENT_BIRTH_YEAR_3_TO_6,
    })
  }
  for (let i = 0; i < inputs.dependents_over_6; i++) {
    dependents.push({
      name: `Dependente ${dependents.length + 1}`,
      birth_year: DEPENDENT_BIRTH_YEAR_OVER_6,
    })
  }
  return dependents
}

function buildPersonIncomes(input: SimulationPersonInput): Income[] {
  const incomes: Income[] = []

  if (input.gross_cat_a > 0) {
    incomes.push({
      category: 'A',
      gross: input.gross_cat_a,
    })
  }

  if (input.gross_cat_b && input.gross_cat_b > 0) {
    incomes.push({
      category: 'B',
      gross: input.gross_cat_b,
      cat_b_regime: 'simplified',
      cat_b_income_code: 403, // services — 75% coefficient
    })
  }

  return incomes
}

function buildPerson(
  input: SimulationPersonInput,
  index: number,
  married: boolean,
  enableIrsJovem: boolean,
): Person {
  const label = married ? (index === 0 ? 'Sujeito Passivo A' : 'Sujeito Passivo B') : 'Contribuinte'

  const specialRegimes: SpecialRegime[] = []
  if (input.nhr) specialRegimes.push('nhr')
  if (enableIrsJovem && !input.nhr) specialRegimes.push('irs_jovem')

  const person: Person = {
    name: label,
    birth_year: input.birth_year,
    incomes: buildPersonIncomes(input),
    deductions: [{ category: 'general', amount: DEFAULT_GENERAL_DEDUCTION } as Deduction],
    special_regimes: specialRegimes,
  }

  // NHR: assume active, started recently
  if (input.nhr) {
    person.nhr_start_year = TAX_YEAR - 1
    person.nhr_confirmed = true
  }

  // IRS Jovem: infer first_work_year from age
  if (enableIrsJovem && !input.nhr) {
    const age = TAX_YEAR - input.birth_year
    if (age <= YOUNG_AGE_THRESHOLD) {
      person.irs_jovem_first_work_year = input.birth_year + YOUNG_START_AGE
    } else {
      person.irs_jovem_first_work_year = input.birth_year + OLDER_START_AGE
    }
  }

  return person
}

function inferIrsJovemEligible(input: SimulationPersonInput): boolean {
  const age = TAX_YEAR - input.birth_year
  if (age > 35) return false

  // Infer first_work_year
  const firstWorkYear =
    age <= YOUNG_AGE_THRESHOLD
      ? input.birth_year + YOUNG_START_AGE
      : input.birth_year + OLDER_START_AGE
  const benefitYear = TAX_YEAR - firstWorkYear + 1

  return isEligibleForIrsJovem(benefitYear, TAX_YEAR, input.birth_year)
}

/**
 * Build a "current" household — conservative defaults.
 * - Married → married_separate (conservative filing)
 * - No IRS Jovem (user probably doesn't know about it)
 * - Standard deductions only
 */
export function buildSimulationHousehold(inputs: SimulationInputs): Household {
  const members = inputs.persons.map((p, i) => buildPerson(p, i, inputs.married, false))
  const filingStatus: FilingStatus = inputs.married ? 'married_separate' : 'single'

  return {
    year: TAX_YEAR,
    filing_status: filingStatus,
    members,
    dependents: buildDependents(inputs),
    projected: true,
  }
}

/**
 * Build an "optimized" household — best possible scenario.
 * - IRS Jovem applied if eligible (assume year 1 = max benefit)
 * - Filing status will be compared (joint vs separate) by the engine
 * - Standard deductions, but proactive optimizations will add more
 */
export function buildOptimizedSimulationHousehold(inputs: SimulationInputs): Household {
  const members = inputs.persons.map((p, i) => {
    const eligible = inferIrsJovemEligible(p)
    return buildPerson(p, i, inputs.married, eligible)
  })

  // For married couples, use married_joint as the base — the engine will
  // also compare with married_separate via analyzeHousehold
  const filingStatus: FilingStatus = inputs.married ? 'married_joint' : 'single'

  return {
    year: TAX_YEAR,
    filing_status: filingStatus,
    members,
    dependents: buildDependents(inputs),
    projected: true,
  }
}

/**
 * Compute simulation results: current vs optimized scenarios.
 * Returns both analysis results and the total savings difference.
 */
export function computeSimulationResults(inputs: SimulationInputs): SimulationResults {
  const currentHousehold = buildSimulationHousehold(inputs)
  const optimizedHousehold = buildOptimizedSimulationHousehold(inputs)

  const current = analyzeHousehold(currentHousehold)
  const optimized = analyzeHousehold(optimizedHousehold)

  // Best burden from each analysis
  const currentBest = getBestBurden(current)
  const optimizedBest = getBestBurden(optimized)

  const totalSavings = Math.max(0, currentBest - optimizedBest)

  return { current, optimized, total_savings: totalSavings }
}

function getBestBurden(result: AnalysisResult): number {
  // If optimized burdens exist (proactive recommendations), use the best of those
  if (result.optimized_burdens && result.optimized_burdens.length > 0) {
    return Math.min(...result.optimized_burdens.map((b) => b.total_tax_burden))
  }
  // Otherwise use the recommended scenario's burden
  const recommended = result.scenarios.find((s) => s.label === result.recommended_scenario)
  return recommended?.total_tax_burden ?? result.scenarios[0].total_tax_burden
}
