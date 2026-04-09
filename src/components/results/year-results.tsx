import { Sparkles, Users, User, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
