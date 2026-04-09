'use client'

import { useState } from 'react'
import { Sparkles, Users, User, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { AnalysisResult, PersonTaxDetail, ScenarioResult } from '@/lib/tax/types'
import type { ResultsView } from '@/lib/tax/results-view'
import { personTotalIrs, scenarioRefund } from '@/lib/tax/historical-comparison'
import { formatEuro, formatPercent } from '@/lib/utils'
import { useT } from '@/lib/i18n'

function personRefund(p: PersonTaxDetail): number {
  return p.withholding_total - personTotalIrs(p)
}

export function YearResults({
  result,
  view,
  amendable,
  projected,
  simulationBaseline,
  hideWithholdings,
  usePersonTabs,
}: {
  result: AnalysisResult
  view: ResultsView
  amendable: boolean
  projected?: boolean
  /** In simulation mode: the baseline scenario (from current result) to compare against */
  simulationBaseline?: ScenarioResult
  /** Hide refund/toPay metric (redundant when withholdings are 0) */
  hideWithholdings?: boolean
  /** Use tabs instead of side-by-side grid for multi-person display */
  usePersonTabs?: boolean
}) {
  const t = useT()

  // When simulationBaseline is provided, compare across current vs optimized results
  // instead of within the same result's filing strategies
  const effectiveCurrent = simulationBaseline ?? view.currentScenario
  const effectiveOptimal = view.optimalScenario
  const effectiveSavings = simulationBaseline
    ? Math.max(0, simulationBaseline.total_tax_burden - effectiveOptimal.total_tax_burden)
    : view.savings
  const effectiveIsOptimal = simulationBaseline ? effectiveSavings <= 0 : view.isAlreadyOptimal

  const isMulti = effectiveCurrent.persons.length > 1
  const sortedPersonNames = isMulti
    ? [...effectiveCurrent.persons].sort((a, b) => a.name.localeCompare(b.name)).map((p) => p.name)
    : []

  // Shared person tab state so both sections stay in sync
  const [activePerson, setActivePerson] = useState(sortedPersonNames[0] ?? '')

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
        <ScenarioSummary
          scenario={effectiveCurrent}
          isMulti={isMulti}
          hideWithholdings={hideWithholdings}
          usePersonTabs={usePersonTabs}
          activePerson={activePerson}
          onActivePersonChange={setActivePerson}
        />
      </div>

      {/* Optimized scenario — shown when there are savings */}
      {amendable && !effectiveIsOptimal && effectiveSavings > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <h2 className="text-sm font-medium uppercase tracking-wide">
              {t('results.optimizedScenario')}{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold normal-case">
                ({t('results.saves', { amount: formatEuro(effectiveSavings) })})
              </span>
            </h2>
          </div>
          <ScenarioSummary
            scenario={effectiveOptimal}
            baseline={effectiveCurrent}
            isMulti={isMulti}
            hideWithholdings={hideWithholdings}
            usePersonTabs={usePersonTabs}
            activePerson={activePerson}
            onActivePersonChange={setActivePerson}
          />
        </div>
      )}
    </div>
  )
}

function ScenarioSummary({
  scenario,
  baseline,
  isMulti,
  hideWithholdings,
  usePersonTabs,
  activePerson,
  onActivePersonChange,
}: {
  scenario: ScenarioResult
  baseline?: ScenarioResult
  isMulti: boolean
  hideWithholdings?: boolean
  usePersonTabs?: boolean
  activePerson?: string
  onActivePersonChange?: (name: string) => void
}) {
  const t = useT()
  const refund = scenarioRefund(scenario)
  const isRefund = refund >= 0
  const baselineRefund = baseline ? scenarioRefund(baseline) : undefined

  const sortedPersons = [...scenario.persons].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-5">
        <div className="flex items-center gap-2 mb-4">
          {isMulti && <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          <span className="text-sm font-medium text-muted-foreground">
            {isMulti ? t('results.household') : scenario.persons[0].name}
          </span>
        </div>
        <div
          className={
            hideWithholdings ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 sm:grid-cols-4 gap-4'
          }
        >
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
          {!hideWithholdings && (
            <Metric
              label={isRefund ? t('results.refund') : t('results.toPay')}
              value={formatEuro(Math.abs(refund))}
              variant={isRefund ? 'refund' : 'payment'}
              delta={baselineRefund !== undefined ? refund - baselineRefund : undefined}
              deltaGoodWhen="positive"
            />
          )}
        </div>
      </div>

      {isMulti && usePersonTabs && (
        <Tabs value={activePerson} onValueChange={onActivePersonChange}>
          <TabsList className="w-full justify-center">
            {sortedPersons.map((person) => (
              <TabsTrigger key={person.name} value={person.name} className="flex-1">
                {person.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {sortedPersons.map((person) => (
            <TabsContent key={person.name} value={person.name}>
              <PersonCard
                person={person}
                baseline={baseline?.persons.find((p) => p.name === person.name)}
                hideWithholdings={hideWithholdings}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {isMulti && !usePersonTabs && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedPersons.map((person) => (
            <PersonCard
              key={person.name}
              person={person}
              baseline={baseline?.persons.find((p) => p.name === person.name)}
              hideWithholdings={hideWithholdings}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PersonCard({
  person,
  baseline,
  hideWithholdings,
}: {
  person: PersonTaxDetail
  baseline?: PersonTaxDetail
  hideWithholdings?: boolean
}) {
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
        <div
          className={
            hideWithholdings ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 sm:grid-cols-4 gap-3'
          }
        >
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
          {!hideWithholdings && (
            <Metric
              label={isRefund ? t('results.refund') : t('results.toPay')}
              value={formatEuro(Math.abs(refund))}
              variant={isRefund ? 'refund' : 'payment'}
              small
              delta={baselineRefund !== undefined ? refund - baselineRefund : undefined}
              deltaGoodWhen="positive"
            />
          )}
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
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs text-muted-foreground mb-0.5 truncate">{label}</p>
      <div className="flex items-center gap-1 min-w-0">
        <p
          className={`font-bold truncate ${small ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} ${colorClass}`}
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
