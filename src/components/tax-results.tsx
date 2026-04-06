'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Users,
  User,
  Sparkles,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Printer,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { PdfExportButton } from '@/components/pdf-export-button'
import { ShareResults } from '@/components/share-results'
import { TaxChat } from '@/components/tax-chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts'
import type {
  AnalysisResult,
  PersonTaxDetail,
  ScenarioResult,
  ValidationIssue,
} from '@/lib/tax/types'
import { deriveResultsView, type ResultsView } from '@/lib/tax/results-view'
import {
  personTotalIrs,
  scenarioRefund,
  buildHistoricalSeriesData,
  getPersonNames,
  type HistoricalSeriesPoint,
} from '@/lib/tax/historical-comparison'
import { getAmendableYears } from '@/lib/tax/upload-validation'
import { formatEuro, formatPercent } from '@/lib/utils'
import { AnimatedEuro } from '@/hooks/use-count-up'
import { useT } from '@/lib/i18n'
import { RecommendationsPaywall } from '@/components/recommendations-paywall'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'

interface TaxResultsProps {
  results: AnalysisResult[]
  issues?: ValidationIssue[]
  onBack: () => void
  onReset: () => void
  checkoutSessionId?: string | null
  sessionHash?: string
}

// Refund for a single person
function personRefund(p: PersonTaxDetail): number {
  return p.withholding_total - personTotalIrs(p)
}

export function TaxResults({
  results,
  issues = [],
  onBack,
  onReset,
  checkoutSessionId,
  sessionHash,
}: TaxResultsProps) {
  const t = useT()
  const amendableYears = new Set(getAmendableYears())
  const projectedYears = new Set(results.filter((r) => r.household.projected).map((r) => r.year))
  const views = results.map((r) => ({
    result: r,
    view: deriveResultsView(r, {
      amendable: amendableYears.has(r.year) || projectedYears.has(r.year),
    }),
  }))
  const sorted = [...views].sort((a, b) => a.result.year - b.result.year)
  const totalSavings = sorted.reduce((sum, { view }) => sum + view.savings, 0)
  const optimizationCount = results.reduce((sum, r) => sum + r.optimizations.length, 0)
  const hasMultipleYears = sorted.length > 1

  // Default to primary year (most recent non-projected), not the projected year
  const nonProjected = sorted.filter(({ result }) => !projectedYears.has(result.year))
  const primaryYear =
    nonProjected.length > 0
      ? nonProjected[nonProjected.length - 1].result.year
      : sorted[0].result.year
  const [activeYear, setActiveYear] = useState(primaryYear)
  const [unlockedReports, setUnlockedReports] = useState<ActionableReport[] | null>(null)

  return (
    <div className="space-y-8" data-testid="results-container">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-3">
          <h1 tabIndex={-1} className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {t('results.title')}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.print()}
            className="print:hidden"
            aria-label={t('common.print')}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
          </Button>
          <PdfExportButton results={results} unlockedReports={unlockedReports} />
          <ShareResults
            savings={totalSavings}
            optimizationCount={optimizationCount}
            years={sorted.map(({ result }) => result.year)}
          />
        </div>
        {totalSavings > 0 && (
          <p
            className="mt-2 text-emerald-600 dark:text-emerald-400 font-semibold text-lg"
            aria-live="polite"
          >
            <Sparkles className="inline h-4 w-4 mr-1" aria-hidden="true" />
            {t('results.totalSavings', { amount: '' })}
            <AnimatedEuro value={totalSavings} />
          </p>
        )}
      </div>

      {/* Data quality warnings */}
      {issues.filter((i) => i.severity === 'warning' || i.severity === 'error').length > 0 && (
        <div
          className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 print:hidden"
          role="status"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {t('results.dataWarningTitle')}
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
                {issues
                  .filter((i) => i.severity === 'warning' || i.severity === 'error')
                  .map((issue, i) => (
                    <li key={i}>
                      {issue.message}
                      {issue.details && (
                        <span className="text-amber-600/70 dark:text-amber-400/70">
                          {' '}
                          ({issue.details})
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Teaser CTA — visible only when there are savings and paywall is locked */}
      {totalSavings > 0 && optimizationCount > 0 && (
        <a
          href="#recommendations-paywall"
          className="block print:hidden"
          onClick={(e) => {
            e.preventDefault()
            document
              .getElementById('recommendations-paywall')
              ?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {t(
                      optimizationCount === 1
                        ? 'paywall.teaserOptimization'
                        : 'paywall.teaserOptimizations',
                      { count: optimizationCount },
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('paywall.teaserUnlockPrefix')}{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatEuro(totalSavings)}
                    </span>{' '}
                    <span className="text-primary/70">{t('paywall.teaserChatHint')}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary text-sm font-medium shrink-0">
                {t('paywall.teaserCta')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </a>
      )}

      {/* Year tabs or single year */}
      {hasMultipleYears ? (
        <Tabs value={String(activeYear)} onValueChange={(v) => setActiveYear(Number(v))}>
          <TabsList className="w-full justify-center overflow-x-auto print:hidden">
            {sorted.map(({ result, view }) => {
              const isAmendable = amendableYears.has(result.year)
              const isProjected = projectedYears.has(result.year)
              return (
                <TabsTrigger key={result.year} value={String(result.year)} className="gap-1.5">
                  {result.year}
                  {view.savings > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      -{formatEuro(view.savings)}
                    </span>
                  )}
                  {isProjected && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                      ({t('results.projected').toLowerCase()})
                    </span>
                  )}
                  {!isAmendable && !isProjected && (
                    <span className="text-[10px] text-muted-foreground font-normal">
                      ({t('results.historical')})
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
          {sorted.map(({ result, view }) => (
            <TabsContent key={result.year} value={String(result.year)}>
              <YearResults
                result={result}
                view={view}
                amendable={amendableYears.has(result.year) || projectedYears.has(result.year)}
                projected={projectedYears.has(result.year)}
              />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        sorted.map(({ result, view }) => (
          <YearResults
            key={result.year}
            result={result}
            view={view}
            amendable={amendableYears.has(result.year) || projectedYears.has(result.year)}
            projected={projectedYears.has(result.year)}
          />
        ))
      )}

      {/* Print-only: render all years expanded (hidden on screen) */}
      {hasMultipleYears && (
        <div className="hidden print:block print-all-years">
          {sorted.map(({ result, view }) => (
            <div key={result.year} className="print-year-section">
              <YearResults
                result={result}
                view={view}
                amendable={amendableYears.has(result.year) || projectedYears.has(result.year)}
                projected={projectedYears.has(result.year)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Historical comparison (only when multiple years) */}
      {hasMultipleYears && (
        <HistoricalComparison
          views={sorted}
          amendableYears={new Set([...amendableYears, ...projectedYears])}
        />
      )}

      {/* Paywall — unlockable recommendations */}
      <div id="recommendations-paywall">
        <RecommendationsPaywall
          results={results}
          totalSavings={totalSavings}
          onUnlock={setUnlockedReports}
          checkoutSessionId={checkoutSessionId}
          sessionHash={sessionHash}
          chatSlot={
            unlockedReports ? (
              <TaxChat results={results} recommendations={unlockedReports} />
            ) : undefined
          }
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 print:hidden">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </Button>
        <Button variant="outline" onClick={onReset} className="w-full sm:w-auto gap-1.5">
          {t('common.newAnalysis')}
        </Button>
      </div>
    </div>
  )
}

// ─── Year-level results ──────────────────────────────────────

function YearResults({
  result,
  view,
  amendable,
  projected,
}: {
  result: AnalysisResult
  view: ResultsView
  amendable: boolean
  projected?: boolean
}) {
  const t = useT()
  const { currentScenario, optimalScenario, isAlreadyOptimal, savings } = view
  const isMulti = currentScenario.persons.length > 1

  return (
    <div className="space-y-6 mt-2">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t('results.fiscalYear', { year: result.year })}
          {projected && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {t('results.projected')}
            </span>
          )}
        </p>
        {projected && (
          <p className="mt-1 text-xs text-muted-foreground italic">{t('results.projectedNote')}</p>
        )}
        {!amendable && !projected && (
          <p className="mt-1 text-xs text-muted-foreground italic">{t('results.historicalNote')}</p>
        )}
      </div>

      {/* Current scenario */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {projected
            ? t('results.currentProjection')
            : amendable
              ? t('results.currentSituation')
              : t('results.submittedDeclaration')}
        </h2>
        <ScenarioSummary scenario={currentScenario} isMulti={isMulti} />
      </div>

      {/* Optimized scenario — only for amendable years */}
      {amendable && !isAlreadyOptimal && savings > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h2 className="text-sm font-medium uppercase tracking-wide">
              {t('results.optimizedScenario')}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case">
                ({t('results.saves', { amount: formatEuro(savings) })})
              </span>
            </h2>
          </div>
          <ScenarioSummary
            scenario={optimalScenario}
            baseline={currentScenario}
            isMulti={isMulti}
          />
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function ScenarioSummary({
  scenario,
  baseline,
  isMulti,
}: {
  scenario: ScenarioResult
  baseline?: ScenarioResult
  isMulti: boolean
}) {
  const t = useT()
  const refund = scenarioRefund(scenario)
  const isRefund = refund >= 0
  const baselineRefund = baseline ? scenarioRefund(baseline) : undefined

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          {isMulti && <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          <span className="text-sm font-medium text-muted-foreground">
            {isMulti ? t('results.household') : scenario.persons[0].name}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Metric label={t('results.income')} value={formatEuro(scenario.total_gross)} />
          <Metric
            label={t('results.irs')}
            value={formatEuro(scenario.total_irs)}
            variant="tax"
            delta={baseline ? scenario.total_irs - baseline.total_irs : undefined}
            deltaGoodWhen="negative"
          />
          <Metric
            label={t('results.effectiveRate')}
            value={formatPercent(scenario.effective_rate_irs)}
            variant="rate"
            delta={baseline ? scenario.effective_rate_irs - baseline.effective_rate_irs : undefined}
            deltaGoodWhen="negative"
          />
          <Metric
            label={isRefund ? t('results.refund') : t('results.toPay')}
            value={formatEuro(Math.abs(refund))}
            variant={isRefund ? 'refund' : 'payment'}
            delta={baselineRefund !== undefined ? refund - baselineRefund : undefined}
            deltaGoodWhen="positive"
          />
        </div>
      </div>

      {isMulti && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...scenario.persons]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((person) => (
              <PersonCard
                key={person.name}
                person={person}
                baseline={baseline?.persons.find((p) => p.name === person.name)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({ person, baseline }: { person: PersonTaxDetail; baseline?: PersonTaxDetail }) {
  const t = useT()
  const refund = personRefund(person)
  const isRefund = refund >= 0
  const baselineRefund = baseline ? personRefund(baseline) : undefined
  const baselineIrs = baseline ? personTotalIrs(baseline) : undefined

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="font-semibold">{person.name}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label={t('results.income')} value={formatEuro(person.gross_income)} small />
          <Metric
            label={t('results.irs')}
            value={formatEuro(personTotalIrs(person))}
            variant="tax"
            small
            delta={baselineIrs !== undefined ? personTotalIrs(person) - baselineIrs : undefined}
            deltaGoodWhen="negative"
          />
          <Metric
            label={t('results.rate')}
            value={formatPercent(person.effective_rate_irs)}
            variant="rate"
            small
            delta={baseline ? person.effective_rate_irs - baseline.effective_rate_irs : undefined}
            deltaGoodWhen="negative"
          />
          <Metric
            label={isRefund ? t('results.refund') : t('results.toPay')}
            value={formatEuro(Math.abs(refund))}
            variant={isRefund ? 'refund' : 'payment'}
            small
            delta={baselineRefund !== undefined ? refund - baselineRefund : undefined}
            deltaGoodWhen="positive"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  variant,
  small,
  delta,
  deltaGoodWhen,
}: {
  label: string
  value: string
  variant?: 'tax' | 'rate' | 'refund' | 'payment'
  small?: boolean
  delta?: number
  deltaGoodWhen?: 'positive' | 'negative'
}) {
  const colorClass =
    variant === 'tax'
      ? 'text-red-600 dark:text-red-400'
      : variant === 'refund'
        ? 'text-emerald-600 dark:text-emerald-400'
        : variant === 'payment'
          ? 'text-amber-600 dark:text-amber-400'
          : variant === 'rate'
            ? 'text-slate-600 dark:text-slate-300'
            : ''

  const showDelta = delta !== undefined && Math.abs(delta) > 0.001
  const isUp = delta !== undefined && delta > 0
  const isGood = deltaGoodWhen === 'positive' ? isUp : !isUp
  const DeltaIcon = isUp ? ArrowUp : ArrowDown
  const deltaColor = isGood
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1">
        <p
          className={`font-bold whitespace-nowrap ${small ? 'text-base' : 'text-lg sm:text-xl'} ${colorClass}`}
        >
          {value}
        </p>
        {showDelta && (
          <DeltaIcon className={`h-3.5 w-3.5 shrink-0 ${deltaColor}`} aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

// ─── Historical Comparison ───────────────────────────────────

const euroTickFormatter = (v: number) => `${(v / 1000).toFixed(0)}k€`
const rateTickFormatter = (v: number) => `${(v * 100).toFixed(0)}%`

function HistoricalComparison({
  views,
  amendableYears,
}: {
  views: { result: AnalysisResult; view: ResultsView }[]
  amendableYears: Set<number>
}) {
  const t = useT()
  const personNames = getPersonNames(views)
  const hasMultiplePeople = personNames.length > 1
  const [selectedPerson, setSelectedPerson] = useState<string | undefined>(undefined)

  const data = buildHistoricalSeriesData(views, amendableYears, selectedPerson)
  const hasAnyOptimization = data.some((d) => d.amendable && d.optimizedIrs !== d.currentIrs)
  const showPlots = data.length > 2

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('results.historicalEvolution')}
          </h2>
        </div>
      </div>

      {hasMultiplePeople && (
        <Tabs
          value={selectedPerson ?? '__combined__'}
          onValueChange={(v) => setSelectedPerson(v === '__combined__' ? undefined : v)}
        >
          <TabsList>
            <TabsTrigger value="__combined__">
              <Users className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              {t('results.combined')}
            </TabsTrigger>
            {personNames.map((name) => (
              <TabsTrigger key={name} value={name}>
                <User className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                {name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {showPlots ? (
        <HistoricalPlots data={data} showOptimized={hasAnyOptimization} />
      ) : (
        <HistoricalTable data={data} showOptimized={hasAnyOptimization} />
      )}
    </div>
  )
}

function HistoricalTable({
  data,
  showOptimized,
}: {
  data: HistoricalSeriesPoint[]
  showOptimized: boolean
}) {
  const t = useT()
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th
              className="px-4 py-3 text-left font-medium text-muted-foreground"
              scope="col"
              rowSpan={2}
            >
              {t('results.year')}
            </th>
            <th
              className="px-4 py-3 text-center font-medium text-muted-foreground border-b"
              scope="colgroup"
              colSpan={4}
            >
              {t('results.current')}
            </th>
            {showOptimized && (
              <th
                className="px-4 py-3 text-center font-medium text-emerald-600 dark:text-emerald-400 border-b"
                scope="colgroup"
                colSpan={4}
              >
                <span className="flex items-center justify-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {t('results.optimized')}
                </span>
              </th>
            )}
          </tr>
          <tr className="border-b bg-muted/30">
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              {t('results.income')}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              {t('results.irs')}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              {t('results.rate')}
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right text-xs font-medium text-muted-foreground"
            >
              {t('results.result')}
            </th>
            {showOptimized && (
              <>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t('results.income')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t('results.irs')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t('results.rate')}
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {t('results.result')}
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => {
            const currentIsRefund = d.currentRefund >= 0
            return (
              <tr key={d.year} className="border-b last:border-0">
                <th className="px-4 py-3 font-semibold whitespace-nowrap text-left" scope="row">
                  {d.year}
                </th>
                {/* Current */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  {formatEuro(d.currentIncome)}
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap text-red-600 dark:text-red-400">
                  {formatEuro(d.currentIrs)}
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {formatPercent(d.currentRate)}
                </td>
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span
                    className={
                      currentIsRefund
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {currentIsRefund ? '+' : '-'}
                    {formatEuro(Math.abs(d.currentRefund))}
                  </span>
                </td>
                {/* Optimized — only for amendable years */}
                {showOptimized && (
                  <>
                    {d.amendable && d.optimizedIrs !== null ? (
                      <>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {formatEuro(d.optimizedIncome!)}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-red-600 dark:text-red-400">
                            {formatEuro(d.optimizedIrs)}
                          </span>
                          {Math.abs(d.optimizedIrs - d.currentIrs) > 0.01 && (
                            <ComparisonArrow
                              diff={d.optimizedIrs - d.currentIrs}
                              goodWhen="negative"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-slate-600 dark:text-slate-300">
                            {formatPercent(d.optimizedRate!)}
                          </span>
                          {Math.abs(d.optimizedRate! - d.currentRate) > 0.001 && (
                            <ComparisonArrow
                              diff={d.optimizedRate! - d.currentRate}
                              goodWhen="negative"
                            />
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span
                            className={
                              d.optimizedRefund! >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {d.optimizedRefund! >= 0 ? '+' : '-'}
                            {formatEuro(Math.abs(d.optimizedRefund!))}
                          </span>
                        </td>
                      </>
                    ) : (
                      <td
                        colSpan={4}
                        className="px-3 py-3 text-center text-xs text-muted-foreground italic"
                      >
                        {t('results.notAmendable')}
                      </td>
                    )}
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ComparisonArrow({ diff, goodWhen }: { diff: number; goodWhen: 'positive' | 'negative' }) {
  const isGood = goodWhen === 'positive' ? diff > 0 : diff < 0
  const Icon = diff > 0 ? ArrowUp : ArrowDown
  const color = isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
  return <Icon className={`inline h-3 w-3 ml-1 ${color}`} aria-hidden="true" />
}

function HistoricalPlots({
  data,
  showOptimized,
}: {
  data: HistoricalSeriesPoint[]
  showOptimized: boolean
}) {
  const t = useT()
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Income & IRS */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {showOptimized ? t('results.incomeAndIrsOptimized') : t('results.incomeAndIrs')}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" fontSize={12} className="fill-muted-foreground" />
              <YAxis
                tickFormatter={euroTickFormatter}
                fontSize={11}
                width={45}
                className="fill-muted-foreground"
              />
              <RechartsTooltip
                formatter={(value, name) => {
                  const labels: Record<string, string> = {
                    currentIncome: t('results.income'),
                    currentIrs: showOptimized ? t('results.irsCurrentLabel') : t('results.irs'),
                    optimizedIrs: t('results.irsOptimizedLabel'),
                  }
                  return [formatEuro(Number(value)), labels[String(name)] ?? String(name)]
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) => {
                  const labels: Record<string, string> = {
                    currentIncome: t('results.income'),
                    currentIrs: showOptimized ? t('results.irsCurrentLabel') : t('results.irs'),
                    optimizedIrs: t('results.irsOptimizedLabel'),
                  }
                  return labels[value] ?? value
                }}
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar
                dataKey="currentIncome"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={0}
              />
              <Bar
                dataKey="currentIrs"
                fill="var(--color-destructive)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={0}
              />
              {showOptimized && (
                <Bar
                  dataKey="optimizedIrs"
                  fill="var(--color-chart-2)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={0}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Effective rate */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {showOptimized ? t('results.effectiveRateOptimized') : t('results.effectiveRateTitle')}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" fontSize={12} className="fill-muted-foreground" />
              <YAxis
                tickFormatter={rateTickFormatter}
                fontSize={11}
                width={40}
                className="fill-muted-foreground"
                domain={[0, 'auto']}
              />
              <RechartsTooltip
                formatter={(value, name) => {
                  const label =
                    name === 'currentRate'
                      ? showOptimized
                        ? t('results.current')
                        : t('results.effectiveRateTitle')
                      : t('results.optimized')
                  return [formatPercent(Number(value)), label]
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'currentRate'
                    ? showOptimized
                      ? t('results.current')
                      : t('results.effectiveRateTitle')
                    : value === 'optimizedRate'
                      ? t('results.optimized')
                      : value
                }
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="currentRate"
                stroke="var(--color-destructive)"
                strokeWidth={2}
                dot={{ r: 4, fill: 'var(--color-destructive)' }}
                activeDot={{ r: 6 }}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={0}
              />
              {showOptimized && (
                <Line
                  type="monotone"
                  dataKey="optimizedRate"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--color-chart-2)' }}
                  activeDot={{ r: 6 }}
                  strokeDasharray="5 5"
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={0}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Refund/Payment */}
      <Card className="md:col-span-2">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            {showOptimized ? t('results.resultOptimized') : t('results.result')}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="year" fontSize={12} className="fill-muted-foreground" />
              <YAxis
                tickFormatter={euroTickFormatter}
                fontSize={11}
                width={45}
                className="fill-muted-foreground"
              />
              <RechartsTooltip
                formatter={(value, name) => {
                  const v = Number(value)
                  const label =
                    name === 'currentRefund'
                      ? showOptimized
                        ? t('results.current')
                        : t('results.result')
                      : t('results.optimized')
                  return [
                    `${v >= 0 ? '+' : '-'}${formatEuro(Math.abs(v))}`,
                    `${v >= 0 ? t('results.refund') : t('results.toPay')} (${label})`,
                  ]
                }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  fontSize: '12px',
                }}
              />
              <Legend
                formatter={(value: string) =>
                  value === 'currentRefund'
                    ? showOptimized
                      ? t('results.current')
                      : t('results.result')
                    : value === 'optimizedRefund'
                      ? t('results.optimized')
                      : value
                }
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar
                dataKey="currentRefund"
                fill="var(--color-destructive)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
                animationBegin={0}
              />
              {showOptimized && (
                <Bar
                  dataKey="optimizedRefund"
                  fill="var(--color-chart-2)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                  animationEasing="ease-out"
                  animationBegin={0}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
