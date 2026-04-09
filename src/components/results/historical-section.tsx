'use client'

import { useState } from 'react'
import { TrendingUp, Users, User, Sparkles, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import type { AnalysisResult } from '@/lib/tax/types'
import type { ResultsView } from '@/lib/tax/results-view'
import {
  buildHistoricalSeriesData,
  getPersonNames,
  type HistoricalSeriesPoint,
} from '@/lib/tax/historical-comparison'
import { formatEuro, formatPercent } from '@/lib/utils'
import { useT } from '@/lib/i18n'

const euroTickFormatter = (v: number) => `${(v / 1000).toFixed(0)}k€`
const rateTickFormatter = (v: number) => `${(v * 100).toFixed(0)}%`

export function HistoricalComparison({
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
