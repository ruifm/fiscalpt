import type { AnalysisResult, ScenarioResult } from './types'

export interface ResultsView {
  currentScenario: ScenarioResult
  optimalScenario: ScenarioResult
  isAlreadyOptimal: boolean
  /** Positive = user saves by switching to optimal filing strategy */
  savings: number
  /** Savings from proactive optimizations computed via tax engine (projected years only) */
  proactiveSavings: number
  /** Combined savings: filing strategy + proactive optimizations */
  totalSavings: number
}

export interface DeriveResultsViewOptions {
  amendable?: boolean
}

export function deriveResultsView(
  result: AnalysisResult,
  options?: DeriveResultsViewOptions,
): ResultsView {
  const filingStatus = result.household.filing_status
  const amendable = options?.amendable ?? true

  const currentScenario =
    result.scenarios.find((s) => s.filing_status === filingStatus) ?? result.scenarios[0]

  if (!amendable) {
    // Non-amendable: compare current filing against optimized version of same filing
    const proactiveSavings = computeProactiveSavings(
      result,
      currentScenario.filing_status,
      currentScenario.total_tax_burden,
    )
    return {
      currentScenario,
      optimalScenario: currentScenario,
      isAlreadyOptimal: true,
      savings: 0,
      proactiveSavings,
      totalSavings: proactiveSavings,
    }
  }

  const optimalScenario = result.scenarios.reduce((a, b) =>
    a.total_tax_burden <= b.total_tax_burden ? a : b,
  )

  // Amendable: compare optimal filing against best optimized scenario
  const proactiveSavings = computeProactiveSavingsGlobal(result, optimalScenario.total_tax_burden)

  const isAlreadyOptimal = currentScenario.filing_status === optimalScenario.filing_status
  const savings = Math.max(0, currentScenario.total_tax_burden - optimalScenario.total_tax_burden)

  return {
    currentScenario,
    optimalScenario,
    isAlreadyOptimal,
    savings,
    proactiveSavings,
    totalSavings: savings + proactiveSavings,
  }
}

/** Proactive savings for a specific filing status (non-amendable case) */
function computeProactiveSavings(
  result: AnalysisResult,
  filingStatus: string,
  currentBurden: number,
): number {
  if (!result.household.projected || !result.optimized_burdens) return 0
  const optimized = result.optimized_burdens.find((b) => b.filing_status === filingStatus)
  if (!optimized) return 0
  return Math.max(0, currentBurden - optimized.total_tax_burden)
}

/** Proactive savings using global best across all filing strategies (amendable case) */
function computeProactiveSavingsGlobal(result: AnalysisResult, optimalBurden: number): number {
  if (!result.household.projected || !result.optimized_burdens) return 0
  const bestOptimized = Math.min(...result.optimized_burdens.map((b) => b.total_tax_burden))
  return Math.max(0, optimalBurden - bestOptimized)
}
