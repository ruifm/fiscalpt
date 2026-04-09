import type { AnalysisResult, ScenarioResult } from './types'

export interface ResultsView {
  currentScenario: ScenarioResult
  optimalScenario: ScenarioResult
  isAlreadyOptimal: boolean
  /** Positive = user saves by switching to optimal filing strategy */
  savings: number
  /** Sum of estimated_savings from proactive optimizations (projected years only) */
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

  // Proactive savings only count for projected years
  const proactiveSavings = result.household.projected
    ? result.optimizations.reduce((sum, o) => sum + o.estimated_savings, 0)
    : 0

  if (!amendable) {
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
