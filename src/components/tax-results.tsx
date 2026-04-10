'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  ArrowLeft,
  Sparkles,
  Printer,
  Lock,
  ArrowRight,
  AlertTriangle,
  Share2,
  Check,
} from 'lucide-react'
import { PdfExportButton } from '@/components/pdf-export-button'
import { ShareResults } from '@/components/share-results'
import { TaxChat } from '@/components/tax-chat'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { AnalysisResult, ValidationIssue } from '@/lib/tax/types'
import { deriveResultsView } from '@/lib/tax/results-view'
import { getAmendableYears } from '@/lib/tax/upload-validation'
import { formatEuro } from '@/lib/utils'
import { AnimatedEuro } from '@/hooks/use-count-up'
import { useT } from '@/lib/i18n'
import { RecommendationsPaywall } from '@/components/recommendations-paywall'
import type { ActionableReport } from '@/lib/tax/actionable-recommendations'
import { YearResults } from '@/components/results/year-results'

const HistoricalComparison = dynamic(
  () => import('@/components/results/historical-section').then((mod) => mod.HistoricalComparison),
  { ssr: false },
)

interface TaxResultsProps {
  results: AnalysisResult[]
  issues?: ValidationIssue[]
  onBack: () => void
  onReset: () => void
  onShare?: () => void
  shareCopied?: boolean
  checkoutSessionId?: string | null
  sessionHash?: string
  returnPath?: string
  onPaywallUnlock?: () => void
  simulationMode?: boolean
  simulationSavings?: number
  currentResult?: AnalysisResult
}

export function TaxResults({
  results,
  issues = [],
  onBack,
  onReset,
  onShare,
  shareCopied,
  checkoutSessionId,
  sessionHash,
  returnPath,
  onPaywallUnlock,
  simulationMode = false,
  simulationSavings,
  currentResult,
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

  // In simulation mode, derive the baseline scenario from currentResult
  // currentResult has no IRS Jovem and default filing — its currentScenario
  // is the "what happens if you do nothing special" baseline
  const simulationBaselineView =
    simulationMode && currentResult
      ? deriveResultsView(currentResult, { amendable: true })
      : undefined
  const sorted = [...views].sort((a, b) => a.result.year - b.result.year)
  const totalSavings =
    simulationMode && simulationSavings != null
      ? simulationSavings
      : sorted.reduce((sum, { view }) => sum + view.totalSavings, 0)
  const hasProactiveSavings = sorted.some(({ view }) => view.proactiveSavings > 0)
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

  const handleUnlock = useCallback(
    (reports: ActionableReport[]) => {
      setUnlockedReports(reports)
      onPaywallUnlock?.()
    },
    [onPaywallUnlock],
  )

  return (
    <div className="space-y-8" data-testid="results-container">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-3">
          <h1 tabIndex={-1} className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {simulationMode ? t('simulation.resultsTitle') : t('results.title')}
          </h1>
          {!simulationMode && (
            <>
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
            </>
          )}
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
        {hasProactiveSavings && (
          <p className="mt-1 text-xs text-muted-foreground">
            * {t('results.proactiveSavingsFootnote')}
          </p>
        )}
      </div>

      {/* Data quality warnings — hidden in simulation mode */}
      {!simulationMode &&
        issues.filter((i) => i.severity === 'warning' || i.severity === 'error').length > 0 && (
          <div
            className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 print:hidden"
            role="status"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
                aria-hidden="true"
              />
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

      {/* Top navigation */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 print:hidden">
        <Button variant="outline" onClick={onBack} className="w-full sm:w-auto gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('common.back')}
        </Button>
        <Button variant="outline" onClick={onReset} className="w-full sm:w-auto gap-1.5">
          {t('common.newAnalysis')}
        </Button>
        {onShare && (
          <Button
            variant={shareCopied ? 'default' : 'outline'}
            onClick={onShare}
            className="w-full sm:w-auto gap-1.5"
          >
            {shareCopied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            )}
            {shareCopied ? t('simulation.shareCopied') : t('simulation.share')}
          </Button>
        )}
      </div>

      {/* Teaser CTA — visible when there are savings (paywall locked) */}
      {totalSavings > 0 && (optimizationCount > 0 || simulationMode) && (
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
                    {simulationMode && optimizationCount === 0
                      ? t('simulation.savingsFound')
                      : t(
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
                  {view.totalSavings > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      -{formatEuro(view.totalSavings)}
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
            simulationBaseline={simulationBaselineView?.currentScenario}
            hideWithholdings={simulationMode}
            usePersonTabs={simulationMode}
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

      {/* Historical comparison (only when multiple years, not in simulation) */}
      {!simulationMode && hasMultipleYears && (
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
          onUnlock={handleUnlock}
          checkoutSessionId={checkoutSessionId}
          sessionHash={sessionHash}
          returnPath={returnPath}
          baselineResults={simulationMode && currentResult ? [currentResult] : undefined}
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
        {onShare && (
          <Button
            variant={shareCopied ? 'default' : 'outline'}
            onClick={onShare}
            className="w-full sm:w-auto gap-1.5"
          >
            {shareCopied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Share2 className="h-4 w-4" aria-hidden="true" />
            )}
            {shareCopied ? t('simulation.shareCopied') : t('simulation.share')}
          </Button>
        )}
      </div>
    </div>
  )
}
