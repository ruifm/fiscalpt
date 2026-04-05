import type { Income } from './types'
import {
  SS_EMPLOYEE_RATE,
  SS_INDEPENDENT_BASE_RATIO,
  SS_INDEPENDENT_RATE,
  SS_INDEPENDENT_REDUCTION,
} from './types'
import { round2 } from './utils'

/**
 * Compute Social Security for an employee (Cat A).
 * Employee pays 11% of gross.
 */
export function computeSSEmployee(grossIncome: number): number {
  return round2(grossIncome * SS_EMPLOYEE_RATE)
}

/**
 * Compute Social Security for an independent worker (Cat B).
 * Base = 70% of gross, rate = 21.4%, with optional 75% reduction in first year.
 * Effective rate ≈ 11.25% without reduction, ≈ 8.44% with reduction (first 12 months).
 */
export function computeSSIndependent(grossIncome: number, applyReduction: boolean = false): number {
  const base = grossIncome * SS_INDEPENDENT_BASE_RATIO
  let contribution = base * SS_INDEPENDENT_RATE
  if (applyReduction) {
    contribution *= SS_INDEPENDENT_REDUCTION
  }
  return round2(contribution)
}

/**
 * Compute total SS for a person's incomes.
 */
export function computeTotalSS(incomes: Income[]): number {
  let total = 0
  for (const income of incomes) {
    if (income.ss_paid !== undefined) {
      total += income.ss_paid
    } else if (income.category === 'A') {
      total += computeSSEmployee(income.gross)
    } else if (income.category === 'B') {
      total += computeSSIndependent(income.gross)
    }
    // Other categories (E, F, G, H) don't have SS contributions
  }
  return round2(total)
}
