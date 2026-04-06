import type {
  Household,
  Person,
  Income,
  PersonTaxDetail,
  ScenarioResult,
  AnalysisResult,
  Optimization,
} from './types'
import { validateHousehold } from './input-validation'
import {
  CAT_B_MIN_EXPENSE_RATIO,
  CAT_B_NEW_ACTIVITY_FACTORS,
  getCatBCoefficient,
  getSpecificDeduction,
  AUTONOMOUS_RATE_CAT_E,
  AUTONOMOUS_RATE_CAT_F,
  AUTONOMOUS_RATE_CAT_G,
  CAT_F_REDUCED_RATES,
  CAT_G_REAL_ESTATE_INCLUSION_RATE,
  getMinimoExistencia,
} from './types'
import { getBrackets, computeProgressiveTax, computeSolidaritySurcharge } from './brackets'
import { computeTotalSS } from './social-security'
import {
  computePersonDeductions,
  computeTotalDependentDeductions,
  computeTotalAscendantDeductions,
  computePersonDisabilityDeduction,
  computeDependentDisabilityDeductions,
  computeAscendantDisabilityDeductions,
} from './deductions'
import {
  computeIrsJovemExemption,
  isEligibleForIrsJovem,
  deriveIrsJovemBenefitYear,
} from './irs-jovem'
import { isNhrActive, computeNhrTax } from './nhr'
import { generateProactiveOptimizations } from './proactive-optimizations'
import { round2, round4, sumGross, formatEuro } from './utils'

// ─── Named Constants ─────────────────────────────────────────
const SCENARIO_DIFF_THRESHOLD = 1 // €1 minimum to suggest filing change
const ENGLOBAMENTO_RATE_THRESHOLD = 0.28 // suggest englobamento if effective < autonomous
const ENGLOBAMENTO_MIN_INCOME = 500 // minimum income to suggest englobamento
const IRS_JOVEM_MARGINAL_RATE_ESTIMATE = 0.3 // rough estimate for savings display
const MINIMO_QUALIFYING_RATIO = 0.5 // >50% from Cat A/B/H for mínimo

// Per-person shares of household-level deductions
interface HouseholdDeductionShares {
  dependentDeduction: number
  ascendantDeduction: number
  dependentDisabilityDeduction: number
  ascendantDisabilityDeduction: number
}

// ─── Household Deduction Computation ─────────────────────────
// Computes dependent, ascendant, and disability deductions for
// the household and splits them evenly across members.

function computeHouseholdDeductionShares(
  household: Household,
  numMembers: number,
): HouseholdDeductionShares {
  const dependentDeductions = computeTotalDependentDeductions(household.dependents, household.year)
  const ascendantDeductions = computeTotalAscendantDeductions(
    household.ascendants ?? [],
    household.year,
  )
  const depDisabilityDeductions = computeDependentDisabilityDeductions(
    household.dependents,
    household.year,
  )
  const ascDisabilityDeductions = computeAscendantDisabilityDeductions(
    household.ascendants ?? [],
    household.year,
  )
  const divisor = numMembers > 0 ? numMembers : 1
  return {
    dependentDeduction: dependentDeductions / divisor,
    ascendantDeduction: ascendantDeductions / divisor,
    dependentDisabilityDeduction: depDisabilityDeductions / divisor,
    ascendantDisabilityDeduction: ascDisabilityDeductions / divisor,
  }
}

// ─── Specific Deduction (Art. 25 / Art. 53 CIRS) ────────────
// Applies to Cat A and Cat H separately.
// Per category: taxable = gross - max(specific_deduction_for_year, SS_contributions)
// Limited to the category's gross (can't go negative).

function computeSpecificDeduction(incomes: Income[], category: 'A' | 'H', taxYear: number): number {
  const catIncomes = incomes.filter((i) => i.category === category)
  if (catIncomes.length === 0) return 0

  const totalGross = catIncomes.reduce((sum, i) => sum + i.gross, 0)
  const totalSS = catIncomes.reduce((sum, i) => sum + (i.ss_paid ?? 0), 0)

  return Math.min(totalGross, Math.max(getSpecificDeduction(taxYear), totalSS))
}

// ─── Cat F Autonomous Rate ──────────────────────────────────
// Standard 28%, with reduced rates for long-term rental contracts

function getCatFAutonomousRate(contractDuration?: number): number {
  if (!contractDuration || contractDuration < 2) return AUTONOMOUS_RATE_CAT_F
  for (const { minYears, rate } of CAT_F_REDUCED_RATES) {
    if (contractDuration >= minYears) return rate
  }
  return AUTONOMOUS_RATE_CAT_F
}

// ─── Autonomous Tax Computation ─────────────────────────────
// Cat E/F/G income taxed at flat rates unless englobamento is opted

function computeAutonomousTaxForIncome(income: Income): number {
  if (income.englobamento) return 0 // goes to progressive brackets instead

  switch (income.category) {
    case 'E':
      return income.gross * AUTONOMOUS_RATE_CAT_E

    case 'F': {
      const expenses = income.expenses ?? 0
      const taxableRental = Math.max(0, income.gross - expenses)
      const rate = getCatFAutonomousRate(income.rental_contract_duration)
      return taxableRental * rate
    }

    case 'G': {
      if (income.asset_type === 'real_estate') return 0
      return income.gross * AUTONOMOUS_RATE_CAT_G
    }

    default:
      return 0
  }
}

/**
 * Compute how much Cat E/F/G income contributes to progressive brackets.
 * Shared between NHR and standard paths.
 */
function computeProgressiveContributionEFG(income: Income): number {
  if (income.englobamento) {
    if (income.category === 'F') {
      return Math.max(0, income.gross - (income.expenses ?? 0))
    }
    return income.gross
  }
  if (income.category === 'G' && income.asset_type === 'real_estate') {
    return income.gross * CAT_G_REAL_ESTATE_INCLUSION_RATE
  }
  return 0
}

// ─── Taxable Income Computation ──────────────────────────────

interface TaxableIncomeResult {
  taxableForBrackets: number
  autonomousTax: number
  nhrTaxAmount: number
  irsJovemExemption: number
  grossTotal: number
  specificDeductionCatA: number
  specificDeductionCatH: number
  catBAcrescimo: number
}

/**
 * Compute Cat B taxable income under the simplified regime.
 * Handles coefficient lookup, new-activity reduction, and Art. 31 nº 13 acréscimo.
 */
function computeCatBSimplifiedTaxable(income: Income): { taxable: number; acrescimo: number } {
  const coefficient = getCatBCoefficient(income.cat_b_income_code)
  let taxable = income.gross * coefficient

  // Art. 31 nº 10: reduced coefficient for first years of activity
  const activityFactor = income.cat_b_activity_year
    ? CAT_B_NEW_ACTIVITY_FACTORS[income.cat_b_activity_year]
    : undefined
  if (activityFactor !== undefined) {
    taxable *= activityFactor
  }

  // Art. 31 nº 13: if documented expenses < 15% of gross, shortfall added
  let acrescimo = 0
  if (income.cat_b_documented_expenses !== undefined) {
    const minExpenses = income.gross * CAT_B_MIN_EXPENSE_RATIO
    if (income.cat_b_documented_expenses < minExpenses) {
      acrescimo = round2(minExpenses - income.cat_b_documented_expenses)
    }
  }

  return { taxable, acrescimo }
}

/**
 * Compute taxable income for a person.
 *
 * Income routing:
 * - Cat A: progressive brackets, minus specific deduction (Art. 25)
 * - Cat B: progressive brackets, × coefficient (simplified) or minus expenses (organized)
 * - Cat H: progressive brackets, minus specific deduction (Art. 53)
 * - Cat E/F/G: autonomous tax or progressive (englobamento/real estate)
 *
 * NHR overrides Cat A/B to 20% flat rate.
 * IRS Jovem exemption subtracted from progressive portion.
 */
function computeTaxableIncome(person: Person, taxYear: number): TaxableIncomeResult {
  let taxableForBrackets = 0
  let autonomousTax = 0
  let nhrTaxAmount = 0
  let irsJovemExemption = 0
  let catBAcrescimo = 0

  const hasNhr =
    person.special_regimes.includes('nhr') &&
    isNhrActive(person.nhr_start_year, taxYear, person.nhr_confirmed)

  // Derive benefit year from stable first_work_year when available
  const effectiveBenefitYear = deriveIrsJovemBenefitYear(
    person.irs_jovem_year,
    person.irs_jovem_first_work_year,
    taxYear,
  )
  const hasIrsJovem =
    person.special_regimes.includes('irs_jovem') &&
    isEligibleForIrsJovem(effectiveBenefitYear, taxYear)

  const grossTotal = sumGross(person.incomes)
  const specificDeductionCatA = computeSpecificDeduction(person.incomes, 'A', taxYear)
  const specificDeductionCatH = computeSpecificDeduction(person.incomes, 'H', taxYear)

  if (hasNhr) {
    // NHR: Cat A+B → 20% flat rate
    nhrTaxAmount = computeNhrTax(person.incomes)

    // Cat H → progressive, Cat E/F/G → autonomous or progressive
    for (const income of person.incomes) {
      if (income.category === 'A' || income.category === 'B') continue
      if (income.category === 'H') {
        taxableForBrackets += income.gross
      } else {
        autonomousTax += computeAutonomousTaxForIncome(income)
        taxableForBrackets += computeProgressiveContributionEFG(income)
      }
    }

    // Apply Cat H specific deduction
    if (specificDeductionCatH > 0) {
      taxableForBrackets = Math.max(0, taxableForBrackets - specificDeductionCatH)
    }
  } else {
    // Standard computation (no NHR)

    // Cat A: gross - specific deduction
    const catAGross = sumGross(person.incomes, ['A'])
    taxableForBrackets += Math.max(0, catAGross - specificDeductionCatA)

    // Cat H: gross - specific deduction
    const catHGross = sumGross(person.incomes, ['H'])
    taxableForBrackets += Math.max(0, catHGross - specificDeductionCatH)

    // Cat B, E, F, G
    for (const income of person.incomes) {
      if (income.category === 'A' || income.category === 'H') continue

      if (income.category === 'B') {
        if (income.cat_b_regime === 'organized' && income.expenses !== undefined) {
          taxableForBrackets += Math.max(0, income.gross - income.expenses)
        } else {
          const { taxable, acrescimo } = computeCatBSimplifiedTaxable(income)
          taxableForBrackets += taxable + acrescimo
          catBAcrescimo += acrescimo
        }
      } else {
        // Cat E/F/G: autonomous + progressive contribution
        autonomousTax += computeAutonomousTaxForIncome(income)
        taxableForBrackets += computeProgressiveContributionEFG(income)
      }
    }

    // Apply IRS Jovem exemption (only on Cat A + B qualifying income)
    if (hasIrsJovem && effectiveBenefitYear !== undefined) {
      irsJovemExemption = computeIrsJovemExemption(person.incomes, effectiveBenefitYear, taxYear)
      taxableForBrackets = Math.max(0, taxableForBrackets - irsJovemExemption)
    }
  }

  autonomousTax = round2(autonomousTax)

  return {
    taxableForBrackets,
    autonomousTax,
    nhrTaxAmount,
    irsJovemExemption,
    grossTotal,
    specificDeductionCatA,
    specificDeductionCatH,
    catBAcrescimo,
  }
}

// ─── Mínimo de Existência (Art. 70 CIRS) ────────────────────
// After IRS computation, net income must not fall below the minimum.
// Only applies when income is predominantly (>50%) from Cat A, B, or H.
// Formula: progressive_irs ≤ max(0, gross - minimo)

function applyMinimoExistencia(
  progressiveIrs: number,
  grossTotal: number,
  person: Person,
  taxYear: number,
): { cappedIrs: number; applied: boolean } {
  const minimo = getMinimoExistencia(taxYear)

  // Check if income is predominantly from Cat A, B, or H
  const qualifyingGross = sumGross(person.incomes, ['A', 'B', 'H'])

  if (qualifyingGross <= grossTotal * MINIMO_QUALIFYING_RATIO) {
    return { cappedIrs: progressiveIrs, applied: false }
  }

  const maxIrs = Math.max(0, grossTotal - minimo)
  if (progressiveIrs > maxIrs) {
    return { cappedIrs: maxIrs, applied: true }
  }

  return { cappedIrs: progressiveIrs, applied: false }
}

// ─── Art. 81 CIRS — Double Taxation Credit ──────────────────
// Credit = min(foreign_tax_paid, proportional_portuguese_tax)
// where proportional = (coleta_líquida × foreign_income / total_income)

function computeDoubleTaxationCredit(
  incomes: Income[],
  coletaLiquida: number,
  grossTotal: number,
): number {
  if (grossTotal <= 0) return 0

  let credit = 0
  for (const income of incomes) {
    if (income.foreign_tax_paid && income.foreign_tax_paid > 0) {
      const proportionalPtTax = coletaLiquida * (income.gross / grossTotal)
      credit += Math.max(0, Math.min(income.foreign_tax_paid, proportionalPtTax))
    }
  }
  return round2(credit)
}

// ─── Person Tax Computation ──────────────────────────────────

function computePersonTax(
  person: Person,
  taxYear: number,
  brackets: ReturnType<typeof getBrackets>,
  householdShares: HouseholdDeductionShares,
): PersonTaxDetail {
  const {
    taxableForBrackets,
    autonomousTax,
    nhrTaxAmount,
    irsJovemExemption,
    grossTotal,
    specificDeductionCatA,
    specificDeductionCatH,
    catBAcrescimo,
  } = computeTaxableIncome(person, taxYear)

  const irsBeforeDeductions = computeProgressiveTax(taxableForBrackets, brackets)

  // Taxa adicional de solidariedade (Art. 68-A CIRS)
  const solidaritySurcharge = computeSolidaritySurcharge(taxableForBrackets)

  const personalDeductions = computePersonDeductions(person.deductions, taxYear, person.birth_year)

  // Art. 87 — taxpayer disability deduction
  const personDisability = computePersonDisabilityDeduction(person, taxYear)

  const totalDeductions =
    personalDeductions +
    householdShares.dependentDeduction +
    householdShares.ascendantDeduction +
    personDisability +
    householdShares.dependentDisabilityDeduction +
    householdShares.ascendantDisabilityDeduction

  let irsAfterDeductions = Math.max(0, irsBeforeDeductions - totalDeductions)

  // Apply mínimo de existência (Art. 70 CIRS)
  const { cappedIrs, applied: minimoApplied } = applyMinimoExistencia(
    irsAfterDeductions,
    grossTotal,
    person,
    taxYear,
  )
  irsAfterDeductions = cappedIrs

  // Art. 81 CIRS — Double taxation credit
  const coletaLiquida = irsAfterDeductions + solidaritySurcharge + autonomousTax
  const doubleTaxationCredit = computeDoubleTaxationCredit(
    person.incomes,
    coletaLiquida,
    grossTotal,
  )

  const totalIrs = Math.max(
    0,
    irsAfterDeductions + solidaritySurcharge + nhrTaxAmount + autonomousTax - doubleTaxationCredit,
  )

  const ssTotal = computeTotalSS(person.incomes)
  const withholdingTotal = person.incomes.reduce((sum, i) => sum + (i.withholding ?? 0), 0)

  const effectiveRateIrs = grossTotal > 0 ? totalIrs / grossTotal : 0
  const effectiveRateTotal = grossTotal > 0 ? (totalIrs + ssTotal) / grossTotal : 0

  return {
    name: person.name,
    gross_income: grossTotal,
    taxable_income: taxableForBrackets,
    irs_before_deductions: round2(irsBeforeDeductions),
    deductions_total: round2(totalDeductions),
    irs_after_deductions: round2(irsAfterDeductions),
    autonomous_tax: round2(autonomousTax),
    solidarity_surcharge: round2(solidaritySurcharge),
    specific_deduction: round2(specificDeductionCatA + specificDeductionCatH),
    cat_b_acrescimo: round2(catBAcrescimo),
    double_taxation_credit: doubleTaxationCredit,
    ss_total: round2(ssTotal),
    withholding_total: round2(withholdingTotal),
    irs_jovem_exemption: round2(irsJovemExemption),
    nhr_tax: round2(nhrTaxAmount),
    minimo_existencia_applied: minimoApplied,
    effective_rate_irs: round4(effectiveRateIrs),
    effective_rate_total: round4(effectiveRateTotal),
    dependent_deduction_share: round2(householdShares.dependentDeduction),
    ascendant_deduction_share: round2(householdShares.ascendantDeduction),
    disability_deductions: round2(
      personDisability +
        householdShares.dependentDisabilityDeduction +
        householdShares.ascendantDisabilityDeduction,
    ),
  }
}

// ─── Joint Filing — Proportional Distribution ───────────────
// After computing joint-level IRS, distribute shares proportionally
// to each person based on their taxable income (progressive portion).
// NHR persons have zero taxable income so they get no progressive share.

interface JointTotals {
  irsBeforeDeductions: number
  irsAfterDeductions: number
  solidaritySurcharge: number
  combinedDoubleTaxCredit: number
  combinedGross: number
  combinedTaxable: number
  dependentDeductions: number
  ascendantDeductions: number
  depDisabilityDeductions: number
  ascDisabilityDeductions: number
  minimoApplied: boolean
}

function distributeJointShares(personDetails: PersonTaxDetail[], totals: JointTotals): void {
  const numPersons = personDetails.length
  const householdDeductionTotal =
    totals.dependentDeductions +
    totals.ascendantDeductions +
    totals.depDisabilityDeductions +
    totals.ascDisabilityDeductions

  for (const pd of personDetails) {
    // Progressive tax is distributed by taxable income ratio (not gross).
    // NHR persons have taxable_income = 0, so they correctly get no progressive share.
    const progressiveProportion =
      totals.combinedTaxable > 0 ? pd.taxable_income / totals.combinedTaxable : 0
    const grossProportion = totals.combinedGross > 0 ? pd.gross_income / totals.combinedGross : 0

    pd.irs_before_deductions = round2(totals.irsBeforeDeductions * progressiveProportion)
    pd.deductions_total = round2(
      pd.deductions_total + householdDeductionTotal / numPersons + pd.disability_deductions,
    )
    pd.dependent_deduction_share = round2(totals.dependentDeductions / numPersons)
    pd.ascendant_deduction_share = round2(totals.ascendantDeductions / numPersons)
    pd.disability_deductions = round2(
      pd.disability_deductions +
        totals.depDisabilityDeductions / numPersons +
        totals.ascDisabilityDeductions / numPersons,
    )

    const progressiveShare = round2(totals.irsAfterDeductions * progressiveProportion)
    pd.irs_after_deductions = progressiveShare
    pd.solidarity_surcharge = round2(totals.solidaritySurcharge * progressiveProportion)
    pd.double_taxation_credit = round2(totals.combinedDoubleTaxCredit * grossProportion)
    pd.minimo_existencia_applied = totals.minimoApplied

    const personTotalIrs = Math.max(
      0,
      progressiveShare +
        pd.solidarity_surcharge +
        pd.nhr_tax +
        pd.autonomous_tax -
        pd.double_taxation_credit,
    )
    pd.effective_rate_irs = pd.gross_income > 0 ? round4(personTotalIrs / pd.gross_income) : 0
    pd.effective_rate_total =
      pd.gross_income > 0 ? round4((personTotalIrs + pd.ss_total) / pd.gross_income) : 0
  }
}

// ─── Scenario Computation ────────────────────────────────────

function computeScenarioSeparate(
  household: Household,
  brackets: ReturnType<typeof getBrackets>,
): ScenarioResult {
  const shares = computeHouseholdDeductionShares(household, household.members.length)

  const persons = household.members.map((person) =>
    computePersonTax(person, household.year, brackets, shares),
  )

  return buildScenarioResult('Tributação Separada', 'married_separate', persons)
}

function computeScenarioJoint(
  household: Household,
  brackets: ReturnType<typeof getBrackets>,
): ScenarioResult {
  if (household.members.length !== 2) {
    throw new Error('Joint filing requires exactly 2 members')
  }

  // Compute household deductions (undivided totals for joint filing)
  const fullShares = computeHouseholdDeductionShares(household, 1)
  const dependentDeductions = fullShares.dependentDeduction
  const ascendantDeductions = fullShares.ascendantDeduction
  const depDisabilityDeductions = fullShares.dependentDisabilityDeduction
  const ascDisabilityDeductions = fullShares.ascendantDisabilityDeduction

  // Joint filing (quociente conjugal):
  // 1. Sum all taxable income from both members (progressive portion only)
  // 2. Divide by 2
  // 3. Apply brackets
  // 4. Multiply by 2
  // 5. Apply deductions + mínimo de existência
  // Autonomous tax and NHR tax are per-person, not affected by quociente

  let combinedTaxable = 0
  let combinedNhrTax = 0
  let combinedAutonomousTax = 0
  let combinedGross = 0
  let combinedSS = 0
  let combinedPersonalDeductions = 0
  let combinedPersonDisability = 0

  const personDetails: PersonTaxDetail[] = []

  for (const person of household.members) {
    const result = computeTaxableIncome(person, household.year)

    const ssTotal = computeTotalSS(person.incomes)
    const personalDeductions = computePersonDeductions(
      person.deductions,
      household.year,
      person.birth_year,
    )
    const personDisability = computePersonDisabilityDeduction(person, household.year)
    const withholdingTotal = person.incomes.reduce((sum, i) => sum + (i.withholding ?? 0), 0)

    // NHR and autonomous tax are per-person (not affected by quociente)
    combinedNhrTax += result.nhrTaxAmount
    combinedAutonomousTax += result.autonomousTax

    // Both NHR and non-NHR progressive income uses taxableForBrackets
    // (NHR Cat A/B is already excluded via computeTaxableIncome)
    combinedTaxable += result.taxableForBrackets

    combinedGross += result.grossTotal
    combinedSS += ssTotal
    combinedPersonalDeductions += personalDeductions
    combinedPersonDisability += personDisability

    personDetails.push({
      name: person.name,
      gross_income: result.grossTotal,
      taxable_income: result.taxableForBrackets,
      irs_before_deductions: 0, // filled at joint level
      deductions_total: round2(personalDeductions),
      irs_after_deductions: 0,
      autonomous_tax: round2(result.autonomousTax),
      solidarity_surcharge: 0, // filled at joint level
      specific_deduction: round2(result.specificDeductionCatA + result.specificDeductionCatH),
      cat_b_acrescimo: round2(result.catBAcrescimo),
      double_taxation_credit: 0, // filled at joint level
      ss_total: round2(ssTotal),
      withholding_total: round2(withholdingTotal),
      irs_jovem_exemption: round2(result.irsJovemExemption),
      nhr_tax: round2(result.nhrTaxAmount),
      minimo_existencia_applied: false, // checked at joint level
      effective_rate_irs: 0,
      effective_rate_total: 0,
      dependent_deduction_share: 0, // filled below
      ascendant_deduction_share: 0, // filled below
      disability_deductions: round2(personDisability),
    })
  }

  // Quociente conjugal
  const halfTaxable = combinedTaxable / 2
  const taxOnHalf = computeProgressiveTax(halfTaxable, brackets)
  const irsBeforeDeductions = taxOnHalf * 2

  // Taxa adicional de solidariedade (Art. 68-A CIRS)
  // Applied to half-income (quociente), then multiplied by 2
  const solidaritySurcharge = computeSolidaritySurcharge(halfTaxable) * 2

  const totalDeductions =
    combinedPersonalDeductions +
    dependentDeductions +
    ascendantDeductions +
    combinedPersonDisability +
    depDisabilityDeductions +
    ascDisabilityDeductions
  let irsAfterDeductions = Math.max(0, irsBeforeDeductions - totalDeductions)

  // Mínimo de existência for joint filing
  // Check if combined income is predominantly Cat A/B/H
  const allIncomes = household.members.flatMap((m) => m.incomes)
  const qualifyingGross = sumGross(allIncomes, ['A', 'B', 'H'])

  const minimo = getMinimoExistencia(household.year)
  let minimoApplied = false
  if (minimo && qualifyingGross > combinedGross * MINIMO_QUALIFYING_RATIO) {
    const jointMinimo = minimo * 2
    const maxIrs = Math.max(0, combinedGross - jointMinimo)
    if (irsAfterDeductions > maxIrs) {
      irsAfterDeductions = maxIrs
      minimoApplied = true
    }
  }

  // Art. 81 CIRS — Double taxation credit for foreign income (joint)
  const coletaLiquidaJoint = irsAfterDeductions + solidaritySurcharge + combinedAutonomousTax
  const combinedDoubleTaxCredit = computeDoubleTaxationCredit(
    allIncomes,
    coletaLiquidaJoint,
    combinedGross,
  )

  const totalIrs = Math.max(
    0,
    irsAfterDeductions +
      solidaritySurcharge +
      combinedNhrTax +
      combinedAutonomousTax -
      combinedDoubleTaxCredit,
  )

  // Distribute proportional shares to person details
  distributeJointShares(personDetails, {
    irsBeforeDeductions,
    irsAfterDeductions,
    solidaritySurcharge,
    combinedDoubleTaxCredit,
    combinedGross,
    combinedTaxable,
    dependentDeductions,
    ascendantDeductions,
    depDisabilityDeductions,
    ascDisabilityDeductions,
    minimoApplied,
  })

  return {
    label: 'Tributação Conjunta',
    filing_status: 'married_joint',
    persons: personDetails,
    total_gross: round2(combinedGross),
    total_taxable: round2(combinedTaxable),
    total_irs: round2(totalIrs),
    total_ss: round2(combinedSS),
    total_deductions: round2(totalDeductions),
    total_tax_burden: round2(totalIrs + combinedSS),
    total_net: round2(combinedGross - totalIrs - combinedSS),
    effective_rate_irs: combinedGross > 0 ? round4(totalIrs / combinedGross) : 0,
    effective_rate_total: combinedGross > 0 ? round4((totalIrs + combinedSS) / combinedGross) : 0,
  }
}

function computeScenarioSingle(
  household: Household,
  brackets: ReturnType<typeof getBrackets>,
): ScenarioResult {
  // Single filer: all household deductions go to the one person (divisor = 1)
  const shares = computeHouseholdDeductionShares(household, 1)
  const person = household.members[0]
  const detail = computePersonTax(person, household.year, brackets, shares)

  return buildScenarioResult('Tributação Individual', 'single', [detail])
}

function buildScenarioResult(
  label: string,
  filingStatus: ScenarioResult['filing_status'],
  persons: PersonTaxDetail[],
): ScenarioResult {
  const totalGross = persons.reduce((s, p) => s + p.gross_income, 0)
  const totalTaxable = persons.reduce((s, p) => s + p.taxable_income, 0)
  const totalIrs = persons.reduce(
    (s, p) =>
      s +
      p.irs_after_deductions +
      p.solidarity_surcharge +
      p.nhr_tax +
      p.autonomous_tax -
      p.double_taxation_credit,
    0,
  )
  const totalSS = persons.reduce((s, p) => s + p.ss_total, 0)
  const totalDeductions = persons.reduce((s, p) => s + p.deductions_total, 0)
  const totalBurden = totalIrs + totalSS
  const totalNet = totalGross - totalBurden

  return {
    label,
    filing_status: filingStatus,
    persons,
    total_gross: round2(totalGross),
    total_taxable: round2(totalTaxable),
    total_irs: round2(totalIrs),
    total_ss: round2(totalSS),
    total_deductions: round2(totalDeductions),
    total_tax_burden: round2(totalBurden),
    total_net: round2(totalNet),
    effective_rate_irs: totalGross > 0 ? round4(totalIrs / totalGross) : 0,
    effective_rate_total: totalGross > 0 ? round4(totalBurden / totalGross) : 0,
  }
}

// ─── Optimization Suggestions ────────────────────────────────

function generateFilingOptimization(scenarios: ScenarioResult[]): Optimization | undefined {
  if (scenarios.length < 2) return undefined
  const jointVsSeparateDiff = scenarios[1].total_irs - scenarios[0].total_irs
  if (jointVsSeparateDiff > SCENARIO_DIFF_THRESHOLD) {
    return {
      id: 'joint-filing',
      title: 'Tributação Conjunta',
      description: `Ao optar pela tributação conjunta, o agregado poupa €${jointVsSeparateDiff.toFixed(2)} em IRS.`,
      estimated_savings: round2(jointVsSeparateDiff),
    }
  }
  if (jointVsSeparateDiff < -SCENARIO_DIFF_THRESHOLD) {
    return {
      id: 'separate-filing',
      title: 'Tributação Separada',
      description: `Ao optar pela tributação separada, o agregado poupa €${Math.abs(jointVsSeparateDiff).toFixed(2)} em IRS.`,
      estimated_savings: round2(Math.abs(jointVsSeparateDiff)),
    }
  }
  return undefined
}

function generateIrsJovemOptimizations(household: Household): {
  optimizations: Optimization[]
  totalSavings: number
} {
  const optimizations: Optimization[] = []
  let totalSavings = 0

  for (const person of household.members) {
    const benefitYear = deriveIrsJovemBenefitYear(
      person.irs_jovem_year,
      person.irs_jovem_first_work_year,
      household.year,
    )
    if (
      !person.special_regimes.includes('irs_jovem') ||
      !isEligibleForIrsJovem(benefitYear, household.year)
    )
      continue

    const exemption = computeIrsJovemExemption(person.incomes, benefitYear!, household.year)
    if (exemption > 0) {
      const savings = round2(exemption * IRS_JOVEM_MARGINAL_RATE_ESTIMATE)
      totalSavings += savings
      optimizations.push({
        id: `irs-jovem-${person.name}`,
        title: `IRS Jovem — ${person.name}`,
        description: `${person.name} beneficia do IRS Jovem (ano ${benefitYear}): isenção de €${exemption.toFixed(2)} no rendimento tributável.`,
        estimated_savings: savings,
      })
    }
  }

  return { optimizations, totalSavings }
}

function generateEnglobamentoOptimizations(
  household: Household,
  scenarios: ScenarioResult[],
): Optimization[] {
  const optimizations: Optimization[] = []
  const scenario = scenarios[0]
  if (!scenario) return optimizations

  for (const person of household.members) {
    for (const income of person.incomes) {
      if ((income.category === 'E' || income.category === 'F') && !income.englobamento) {
        const personDetail = scenario.persons.find((p) => p.name === person.name)
        if (
          personDetail &&
          personDetail.effective_rate_irs < ENGLOBAMENTO_RATE_THRESHOLD &&
          income.gross > ENGLOBAMENTO_MIN_INCOME
        ) {
          optimizations.push({
            id: `englobamento-${person.name}-${income.category}`,
            title: `Englobamento Cat. ${income.category} — ${person.name}`,
            description: `${person.name} pode beneficiar do englobamento dos rendimentos da Cat. ${income.category}. A taxa efetiva atual (${(personDetail.effective_rate_irs * 100).toFixed(1)}%) é inferior à taxa autónoma (28%).`,
            estimated_savings: 0,
          })
        }
      }
    }
  }

  return optimizations
}

function generateNhrWarnings(household: Household): Optimization[] {
  const warnings: Optimization[] = []

  for (const person of household.members) {
    if (
      person.special_regimes.includes('nhr') &&
      person.nhr_start_year !== undefined &&
      person.nhr_start_year >= 2024
    ) {
      warnings.push({
        id: `nhr-revocation-${person.name}`,
        title: `Aviso NHR — ${person.name}`,
        description: `O regime NHR foi revogado para novas inscrições a partir de 1 de janeiro de 2024. Registos com início em ${person.nhr_start_year} podem não ser válidos. Verifique junto da AT.`,
        estimated_savings: 0,
      })
    }
  }

  return warnings
}

function generateCatFDurationOptimizations(household: Household): Optimization[] {
  const optimizations: Optimization[] = []

  // Duration tiers in ascending order: [minYears, rate]
  const tiers: { minYears: number; rate: number }[] = [
    { minYears: 0, rate: AUTONOMOUS_RATE_CAT_F },
    ...CAT_F_REDUCED_RATES.toSorted((a, b) => a.minYears - b.minYears),
  ]

  for (const person of household.members) {
    for (const income of person.incomes) {
      if (income.category !== 'F' || income.englobamento) continue

      const currentDuration = income.rental_contract_duration ?? 0
      const currentRate = getCatFAutonomousRate(currentDuration)
      const taxableRental = Math.max(0, income.gross - (income.expenses ?? 0))

      // Find the next tier that offers a lower rate
      const nextTier = tiers.find((t) => t.minYears > currentDuration && t.rate < currentRate)
      if (!nextTier) continue

      const savings = round2(taxableRental * (currentRate - nextTier.rate))
      if (savings <= 0) continue

      optimizations.push({
        id: `cat-f-duration-${person.name}-${income.gross}`,
        title: `Contrato longa duração Cat. F — ${person.name}`,
        description:
          `Um contrato de arrendamento ≥${nextTier.minYears} anos reduz a taxa de ` +
          `${(currentRate * 100).toFixed(0)}% para ${(nextTier.rate * 100).toFixed(0)}%, ` +
          `poupando ${formatEuro(savings)}/ano neste rendimento.`,
        estimated_savings: savings,
      })
    }
  }

  return optimizations
}

// ─── Main Analysis ───────────────────────────────────────────

export function analyzeHousehold(household: Household): AnalysisResult {
  // Log validation issues but never throw — sanitizeNumber already clamps
  // invalid values, so the engine produces the best result it can.
  if (process.env.NODE_ENV === 'development') {
    const validationErrors = validateHousehold(household).filter((e) => e.severity === 'error')
    if (validationErrors.length > 0) {
      console.warn(
        `[FiscalPT] Validation issues for year ${household.year}:`,
        validationErrors.map((e) => `${e.field}: ${e.message}`),
      )
    }
  }

  const brackets = getBrackets(household.year)
  const scenarios: ScenarioResult[] = []

  if (household.filing_status === 'single' || household.members.length === 1) {
    scenarios.push(computeScenarioSingle(household, brackets))
  } else {
    scenarios.push(
      computeScenarioJoint(household, brackets),
      computeScenarioSeparate(household, brackets),
    )
  }

  // Generate all optimization suggestions
  const optimizations: Optimization[] = []

  const filingOpt = generateFilingOptimization(scenarios)
  if (filingOpt) optimizations.push(filingOpt)

  const irsJovem = generateIrsJovemOptimizations(household)
  optimizations.push(...irsJovem.optimizations)
  optimizations.push(...generateEnglobamentoOptimizations(household, scenarios))
  optimizations.push(...generateNhrWarnings(household))
  optimizations.push(...generateCatFDurationOptimizations(household))

  // Find best scenario
  const best = scenarios.reduce((a, b) => (a.total_tax_burden <= b.total_tax_burden ? a : b))

  const jointVsSeparate =
    scenarios.length === 2 ? round2(scenarios[1].total_irs - scenarios[0].total_irs) : undefined

  const analysisResult: AnalysisResult = {
    year: household.year,
    household,
    scenarios,
    recommended_scenario: best.label,
    optimizations,
    joint_vs_separate_savings: jointVsSeparate,
    irs_jovem_savings: irsJovem.totalSavings > 0 ? irsJovem.totalSavings : undefined,
  }

  // Proactive optimizations for projected years
  optimizations.push(...generateProactiveOptimizations(household, analysisResult))

  return analysisResult
}
