import type { TaxBracket } from './types'
import { SOLIDARITY_SURCHARGE_BRACKETS } from './types'
import { round2 } from './utils'

// ─── 2021 Brackets (Lei 2/2020, Art. 68 CIRS) ────────────────
// 7 brackets, in force until June 2022

export const BRACKETS_2021: TaxBracket[] = [
  { upper_limit: 7112, rate: 0.145 },
  { upper_limit: 10732, rate: 0.23 },
  { upper_limit: 20322, rate: 0.285 },
  { upper_limit: 25075, rate: 0.35 },
  { upper_limit: 36967, rate: 0.37 },
  { upper_limit: 80882, rate: 0.45 },
  { upper_limit: Infinity, rate: 0.48 },
]

// ─── 2022 Brackets (Lei 12/2022, Art. 68 CIRS) ───────────────
// Expanded to 9 brackets

export const BRACKETS_2022: TaxBracket[] = [
  { upper_limit: 7116, rate: 0.145 },
  { upper_limit: 10736, rate: 0.23 },
  { upper_limit: 15216, rate: 0.265 },
  { upper_limit: 19696, rate: 0.285 },
  { upper_limit: 25076, rate: 0.35 },
  { upper_limit: 36757, rate: 0.37 },
  { upper_limit: 48033, rate: 0.435 },
  { upper_limit: 75009, rate: 0.45 },
  { upper_limit: Infinity, rate: 0.48 },
]

// ─── 2023 Brackets (Lei 24-D/2022, Art. 68 CIRS) ─────────────

export const BRACKETS_2023: TaxBracket[] = [
  { upper_limit: 7479, rate: 0.145 },
  { upper_limit: 11284, rate: 0.21 },
  { upper_limit: 15992, rate: 0.265 },
  { upper_limit: 20700, rate: 0.285 },
  { upper_limit: 26355, rate: 0.35 },
  { upper_limit: 38632, rate: 0.37 },
  { upper_limit: 50483, rate: 0.435 },
  { upper_limit: 78834, rate: 0.45 },
  { upper_limit: Infinity, rate: 0.48 },
]

// ─── 2024 Brackets (Lei 33/2024, Art. 68 CIRS) ───────────────
// Note: Lei 33/2024 superseded the initial OE 2024 (Lei 82/2023)
// retroactively. The original had 51,997/81,199 upper limits;
// the final version uses 43,000/80,000.

export const BRACKETS_2024: TaxBracket[] = [
  { upper_limit: 7703, rate: 0.13 },
  { upper_limit: 11623, rate: 0.165 },
  { upper_limit: 16472, rate: 0.22 },
  { upper_limit: 21321, rate: 0.25 },
  { upper_limit: 27146, rate: 0.32 },
  { upper_limit: 39791, rate: 0.355 },
  { upper_limit: 43000, rate: 0.435 },
  { upper_limit: 80000, rate: 0.45 },
  { upper_limit: Infinity, rate: 0.48 },
]

// ─── 2025 Brackets (OE 2025) ─────────────────────────────────

export const BRACKETS_2025: TaxBracket[] = [
  { upper_limit: 8059, rate: 0.125 },
  { upper_limit: 12160, rate: 0.16 },
  { upper_limit: 17233, rate: 0.215 },
  { upper_limit: 22306, rate: 0.244 },
  { upper_limit: 28400, rate: 0.314 },
  { upper_limit: 41629, rate: 0.349 },
  { upper_limit: 44987, rate: 0.431 },
  { upper_limit: 83696, rate: 0.446 },
  { upper_limit: Infinity, rate: 0.48 },
]

const BRACKETS_BY_YEAR: Record<number, TaxBracket[]> = {
  2021: BRACKETS_2021,
  2022: BRACKETS_2022,
  2023: BRACKETS_2023,
  2024: BRACKETS_2024,
  2025: BRACKETS_2025,
}

export function getBrackets(year: number): TaxBracket[] {
  const brackets = BRACKETS_BY_YEAR[year]
  if (brackets) return brackets

  // Fall back to latest available year for future years
  const years = Object.keys(BRACKETS_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b)
  if (year > years[years.length - 1]) return BRACKETS_BY_YEAR[years[years.length - 1]]

  throw new Error(`No bracket table available for year ${year}`)
}

/**
 * Compute progressive IRS tax for a given taxable income.
 * Each slice of income is taxed at its bracket rate.
 */
export function computeProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let previousLimit = 0

  for (const bracket of brackets) {
    if (taxableIncome <= previousLimit) break

    const sliceTop = Math.min(taxableIncome, bracket.upper_limit)
    const sliceAmount = sliceTop - previousLimit
    tax += sliceAmount * bracket.rate
    previousLimit = bracket.upper_limit
  }

  return round2(tax)
}

/**
 * Compute marginal rate for a given taxable income.
 */
export function getMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.upper_limit) {
      return bracket.rate
    }
  }

  return brackets[brackets.length - 1].rate
}

/**
 * Compute Taxa Adicional de Solidariedade (Art. 68-A CIRS).
 * 2.5% on taxable income between €80,000 and €250,000.
 * 5% on taxable income above €250,000.
 * For joint filing, taxableIncome should be the per-person half (quociente).
 */
export function computeSolidaritySurcharge(taxableIncome: number): number {
  if (taxableIncome <= SOLIDARITY_SURCHARGE_BRACKETS[0].lower) return 0

  let surcharge = 0
  for (const { lower, upper, rate } of SOLIDARITY_SURCHARGE_BRACKETS) {
    if (taxableIncome <= lower) break
    const sliceTop = Math.min(taxableIncome, upper)
    surcharge += (sliceTop - lower) * rate
  }

  return round2(surcharge)
}

/**
 * Compute the "parcela a abater" (deductible amount) for each bracket.
 * This is a mathematical shortcut: tax = income × rate - parcela.
 * Used for cross-validation with official AT tables.
 */
export function computeParcelaAbater(brackets: TaxBracket[]): number[] {
  const parcelas: number[] = [0]
  for (let i = 1; i < brackets.length; i++) {
    const prevLimit = brackets[i - 1].upper_limit
    const rateDiff = brackets[i].rate - brackets[i - 1].rate
    parcelas.push(round2(parcelas[i - 1] + rateDiff * prevLimit))
  }
  return parcelas
}
