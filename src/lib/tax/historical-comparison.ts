import type { AnalysisResult, PersonTaxDetail, ScenarioResult } from './types'
import type { ResultsView } from './results-view'

export interface HistoricalDataPoint {
  year: number
  income: number
  irs: number
  rate: number
  refund: number
}

export interface HistoricalSeriesPoint {
  year: number
  amendable: boolean
  currentIncome: number
  currentIrs: number
  currentRate: number
  currentRefund: number
  optimizedIncome: number | null
  optimizedIrs: number | null
  optimizedRate: number | null
  optimizedRefund: number | null
}

export function personTotalIrs(p: PersonTaxDetail): number {
  return (
    p.irs_after_deductions +
    p.autonomous_tax +
    p.solidarity_surcharge +
    p.nhr_tax -
    p.double_taxation_credit
  )
}

function personRefund(p: PersonTaxDetail): number {
  return p.withholding_total - personTotalIrs(p)
}

export function scenarioRefund(s: ScenarioResult): number {
  return s.persons.reduce((sum, p) => sum + personRefund(p), 0)
}

function extractPoint(
  scenario: ScenarioResult,
  personName?: string,
): { income: number; irs: number; rate: number; refund: number } {
  if (personName) {
    const person = scenario.persons.find((p) => p.name === personName)
    if (!person) return { income: 0, irs: 0, rate: 0, refund: 0 }
    const irs = personTotalIrs(person)
    return {
      income: person.gross_income,
      irs,
      rate: person.gross_income > 0 ? irs / person.gross_income : 0,
      refund: personRefund(person),
    }
  }
  return {
    income: scenario.total_gross,
    irs: scenario.total_irs,
    rate: scenario.effective_rate_irs,
    refund: scenarioRefund(scenario),
  }
}

export function getPersonNames(views: { result: AnalysisResult; view: ResultsView }[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const { view } of views) {
    for (const p of view.currentScenario.persons) {
      if (!seen.has(p.name)) {
        seen.add(p.name)
        names.push(p.name)
      }
    }
  }
  return names
}

export function buildHistoricalSeriesData(
  views: { result: AnalysisResult; view: ResultsView }[],
  amendableYears: Set<number>,
  personName?: string,
): HistoricalSeriesPoint[] {
  return views.map(({ result, view }) => {
    const current = extractPoint(view.currentScenario, personName)
    const amendable = amendableYears.has(result.year)
    if (!amendable) {
      return {
        year: result.year,
        amendable: false,
        currentIncome: current.income,
        currentIrs: current.irs,
        currentRate: current.rate,
        currentRefund: current.refund,
        optimizedIncome: null,
        optimizedIrs: null,
        optimizedRate: null,
        optimizedRefund: null,
      }
    }
    const optimized = extractPoint(view.optimalScenario, personName)
    return {
      year: result.year,
      amendable: true,
      currentIncome: current.income,
      currentIrs: current.irs,
      currentRate: current.rate,
      currentRefund: current.refund,
      optimizedIncome: optimized.income,
      optimizedIrs: optimized.irs,
      optimizedRate: optimized.rate,
      optimizedRefund: optimized.refund,
    }
  })
}

export function buildHistoricalData(
  views: { result: AnalysisResult; view: ResultsView }[],
): HistoricalDataPoint[] {
  return views.map(({ result, view }) => ({
    year: result.year,
    income: view.currentScenario.total_gross,
    irs: view.currentScenario.total_irs,
    rate: view.currentScenario.effective_rate_irs,
    refund: scenarioRefund(view.currentScenario),
  }))
}
