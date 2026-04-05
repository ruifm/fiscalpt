import type { Income } from './types'
import { round2 } from './utils'

/**
 * NHR - Non-Habitual Resident (Residente Não Habitual)
 *
 * 20% flat rate on qualifying Cat A and Cat B income (high-value activities).
 * Autonomous taxation — not mixed into progressive brackets.
 * 10-year duration from registration.
 * Compatible with joint filing (Art. 72 autonomous, unaffected by Art. 59).
 */

const NHR_RATE = 0.2
const NHR_DURATION = 10

/**
 * Check if NHR is active for a given tax year.
 */
export function isNhrActive(
  nhrStartYear: number | undefined,
  taxYear: number,
  nhrConfirmed?: boolean,
): boolean {
  if (nhrConfirmed) return true
  if (nhrStartYear === undefined) return false
  const yearsActive = taxYear - nhrStartYear
  return yearsActive >= 0 && yearsActive < NHR_DURATION
}

/**
 * Get the income that is subject to NHR (removed from progressive brackets).
 */
export function getNhrQualifyingIncome(incomes: Income[]): number {
  return incomes
    .filter((i) => i.category === 'A' || i.category === 'B')
    .reduce((sum, i) => sum + i.gross, 0)
}

/**
 * Compute NHR tax on qualifying income (Cat A + Cat B).
 * Returns the flat-rate tax amount.
 */
export function computeNhrTax(incomes: Income[]): number {
  return round2(getNhrQualifyingIncome(incomes) * NHR_RATE)
}

/**
 * Get the income that remains subject to progressive brackets under NHR.
 * (Non-qualifying categories: E, F, G, H)
 */
export function getNhrNonQualifyingIncome(incomes: Income[]): number {
  return incomes
    .filter((i) => i.category !== 'A' && i.category !== 'B')
    .reduce((sum, i) => sum + i.gross, 0)
}
