import type { Income } from './types'
import { getIas } from './types'
import { round2 } from './utils'

/**
 * IRS Jovem (Art. 12-B CIRS)
 *
 * The regime changed significantly across tax years:
 *
 * 2021 (Lei 2/2020): 3 years, Cat A only, age 18-26 (30 PhD)
 *   Y1: 30%, cap 7.5×IAS | Y2: 20%, cap 5×IAS | Y3: 10%, cap 2.5×IAS
 *
 * 2022-2023 (Lei 12/2022, Lei 24-D/2022): 5 years, Cat A+B, age 18-26 (30 PhD)
 *   Y1: 50%, cap 12.5×IAS | Y2: 40%, cap 10×IAS | Y3-4: 30%, cap 7.5×IAS | Y5: 20%, cap 5×IAS
 *
 * 2024 (Lei 82/2023): 5 years, Cat A+B, age 18-26 (30 PhD)
 *   Y1: 100%, cap 40×IAS | Y2: 75%, cap 30×IAS | Y3-4: 50%, cap 20×IAS | Y5: 25%, cap 10×IAS
 *
 * 2025 (Lei 45-A/2024): 10 years, Cat A+B, age ≤35
 *   Y1: 100% | Y2-4: 75% | Y5-7: 50% | Y8-10: 25% — all capped at 55×IAS
 */

interface IrsJovemYearRule {
  rate: number
  capFactor: number // multiplied by IAS
}

interface IrsJovemRegime {
  maxBenefitYears: number
  rules: IrsJovemYearRule[] // indexed by benefitYear - 1
  catBEligible: boolean
}

const REGIME_2021: IrsJovemRegime = {
  maxBenefitYears: 3,
  catBEligible: false,
  rules: [
    { rate: 0.3, capFactor: 7.5 }, // Y1
    { rate: 0.2, capFactor: 5 }, // Y2
    { rate: 0.1, capFactor: 2.5 }, // Y3
  ],
}

const REGIME_2022_2023: IrsJovemRegime = {
  maxBenefitYears: 5,
  catBEligible: true,
  rules: [
    { rate: 0.5, capFactor: 12.5 }, // Y1
    { rate: 0.4, capFactor: 10 }, // Y2
    { rate: 0.3, capFactor: 7.5 }, // Y3
    { rate: 0.3, capFactor: 7.5 }, // Y4
    { rate: 0.2, capFactor: 5 }, // Y5
  ],
}

const REGIME_2024: IrsJovemRegime = {
  maxBenefitYears: 5,
  catBEligible: true,
  rules: [
    { rate: 1.0, capFactor: 40 }, // Y1
    { rate: 0.75, capFactor: 30 }, // Y2
    { rate: 0.5, capFactor: 20 }, // Y3
    { rate: 0.5, capFactor: 20 }, // Y4
    { rate: 0.25, capFactor: 10 }, // Y5
  ],
}

const REGIME_2025: IrsJovemRegime = {
  maxBenefitYears: 10,
  catBEligible: true,
  rules: [
    { rate: 1.0, capFactor: 55 }, // Y1
    { rate: 0.75, capFactor: 55 }, // Y2
    { rate: 0.75, capFactor: 55 }, // Y3
    { rate: 0.75, capFactor: 55 }, // Y4
    { rate: 0.5, capFactor: 55 }, // Y5
    { rate: 0.5, capFactor: 55 }, // Y6
    { rate: 0.5, capFactor: 55 }, // Y7
    { rate: 0.25, capFactor: 55 }, // Y8
    { rate: 0.25, capFactor: 55 }, // Y9
    { rate: 0.25, capFactor: 55 }, // Y10
  ],
}

const REGIMES_BY_YEAR: Record<number, IrsJovemRegime> = {
  2021: REGIME_2021,
  2022: REGIME_2022_2023,
  2023: REGIME_2022_2023,
  2024: REGIME_2024,
  2025: REGIME_2025,
}

function getRegime(taxYear: number): IrsJovemRegime | undefined {
  if (REGIMES_BY_YEAR[taxYear]) return REGIMES_BY_YEAR[taxYear]
  const years = Object.keys(REGIMES_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b)
  if (taxYear > years[years.length - 1]) return REGIMES_BY_YEAR[years[years.length - 1]]
  return undefined
}

export function getIrsJovemRegime(taxYear: number): IrsJovemRegime | undefined {
  return getRegime(taxYear)
}

export function getIrsJovemExemptionRate(benefitYear: number, taxYear: number): number {
  const regime = getRegime(taxYear)
  if (!regime) return 0
  if (benefitYear < 1 || benefitYear > regime.maxBenefitYears) return 0
  return regime.rules[benefitYear - 1].rate
}

export function getIrsJovemCap(benefitYear: number, taxYear: number): number {
  const ias = getIas(taxYear)

  const regime = getRegime(taxYear)
  if (!regime) return 0
  if (benefitYear < 1 || benefitYear > regime.maxBenefitYears) return 0

  return regime.rules[benefitYear - 1].capFactor * ias
}

/**
 * Compute the IRS Jovem exemption for qualifying income.
 * Returns the exempt amount (to be subtracted from taxable income).
 */
export function computeIrsJovemExemption(
  incomes: Income[],
  benefitYear: number,
  taxYear: number,
): number {
  const regime = getRegime(taxYear)
  if (!regime) return 0
  if (benefitYear < 1 || benefitYear > regime.maxBenefitYears) return 0

  const rule = regime.rules[benefitYear - 1]
  const ias = getIas(taxYear)

  const cap = rule.capFactor * ias

  // Only qualifying categories
  const qualifyingGross = incomes
    .filter((i) => {
      if (i.category === 'A') return true
      if (i.category === 'B') return regime.catBEligible
      return false
    })
    .reduce((sum, i) => sum + i.gross, 0)

  const exemption = qualifyingGross * rule.rate
  return round2(Math.min(exemption, cap))
}

/**
 * Check if a person is eligible for IRS Jovem in a given tax year.
 */
export function isEligibleForIrsJovem(benefitYear: number | undefined, taxYear?: number): boolean {
  if (benefitYear === undefined || benefitYear < 1) return false

  if (taxYear !== undefined) {
    const regime = getRegime(taxYear)
    if (!regime) return false
    return benefitYear <= regime.maxBenefitYears
  }

  // Fallback: valid for any year with up to 10 benefit years
  return benefitYear >= 1 && benefitYear <= 10
}
