import type { AnalysisResult, ScenarioResult } from './types'

export interface ResultsView {
  currentScenario: ScenarioResult
  optimalScenario: ScenarioResult
  isAlreadyOptimal: boolean
  /** Positive = user saves by switching to optimal */
  savings: number
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
    return { currentScenario, optimalScenario: currentScenario, isAlreadyOptimal: true, savings: 0 }
  }

  const optimalScenario = result.scenarios.reduce((a, b) =>
    a.total_tax_burden <= b.total_tax_burden ? a : b,
  )

  const isAlreadyOptimal = currentScenario.filing_status === optimalScenario.filing_status
  const savings = Math.max(0, currentScenario.total_tax_burden - optimalScenario.total_tax_burden)

  return { currentScenario, optimalScenario, isAlreadyOptimal, savings }
}
