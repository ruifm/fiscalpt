'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Calculator,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  RefreshCw,
  ShieldCheck,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentUpload } from '@/components/document-upload'
import { ResultsSkeleton } from '@/components/results-skeleton'

const HouseholdQuestionnaire = dynamic(
  () => import('@/components/household-questionnaire').then((mod) => mod.HouseholdQuestionnaire),
  { loading: () => <ResultsSkeleton /> },
)

const TaxResults = dynamic(() => import('@/components/tax-results').then((mod) => mod.TaxResults), {
  ssr: false,
  loading: () => <ResultsSkeleton />,
})
import type { Household, AnalysisResult, ValidationIssue } from '@/lib/tax/types'
import { analyzeHousehold } from '@/lib/tax'
import { validateHousehold } from '@/lib/tax/input-validation'
import { validateAgainstLiquidacao, type LiquidacaoParsed } from '@/lib/tax/pdf-extractor'
import {
  saveSessionState,
  loadSessionState,
  clearSessionState,
  generateSessionId,
  migrateLegacySession,
} from '@/lib/session-persistence'
import { propagateSharedData } from '@/lib/tax/propagate-shared-data'
import { estimateProjectedRetentions } from '@/lib/tax/projection'
import { ErrorBoundary } from '@/components/error-boundary'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { OnboardingOverlay } from '@/components/onboarding-overlay'
import { FeedbackButton } from '@/components/feedback-button'
import { useT } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

type Step = 'upload' | 'questionnaire' | 'results'

const STEPS: Step[] = ['upload', 'questionnaire', 'results']

const STEP_LABEL_KEYS: Record<Step, string> = {
  upload: 'analyze.steps.upload',
  questionnaire: 'analyze.steps.questionnaire',
  results: 'analyze.steps.results',
}

export default function AnalyzePage() {
  const t = useT()
  const [step, setStep] = useState<Step>('upload')
  const [households, setHouseholds] = useState<Household[]>([])
  const [results, setResults] = useState<AnalysisResult[]>([])
  const [issues, setIssues] = useState<ValidationIssue[]>([])
  const [liquidacao, setLiquidacao] = useState<LiquidacaoParsed | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const restoredRef = useRef(false)
  // Keeps the households as originally parsed from documents, before
  // questionnaire answers are baked in by applyAnswers. This allows the
  // questionnaire to regenerate all questions when the user navigates back.
  const uploadedHouseholdsRef = useRef<Household[]>([])
  const [furthestStep, setFurthestStep] = useState<number>(0)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const errorBannerRef = useRef<HTMLDivElement>(null)

  // Session ID: read from URL hash or generate a new one
  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return generateSessionId()
    const match = window.location.hash.match(/^#s=([a-z0-9]+)$/)
    return match?.[1] ?? generateSessionId()
  })

  // Capture Stripe checkout session_id before replaceState strips it
  const [checkoutSessionId] = useState(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('session_id')
  })

  // Primary household = most recent year (first in sorted-descending array)
  const primaryHousehold = households[0] ?? null

  // The household to pass to the questionnaire: always use the original
  // uploaded household (before answers are baked in) so all questions appear.
  const questionnaireHousehold = uploadedHouseholdsRef.current[0] ?? primaryHousehold

  function goToStep(target: Step) {
    setStep(target)
    setError(null)
    persistState(target, households, results, issues, liquidacao)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function advanceStep(target: Step) {
    const idx = STEPS.indexOf(target)
    setStep(target)
    setFurthestStep((prev) => Math.max(prev, idx))
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Restore session state on mount
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true

    trackEvent('page_view')

    // Try session-ID-based localStorage first, then legacy sessionStorage
    const saved = loadSessionState(sessionId) ?? migrateLegacySession(sessionId)
    if (saved) {
      const step = saved.step === 'review' ? 'questionnaire' : saved.step
      setStep(step as Step)
      setHouseholds(saved.households)
      setResults(saved.results)
      setIssues(saved.issues)
      setLiquidacao(saved.liquidacao)
      setFurthestStep(STEPS.indexOf(step as Step))

      // Restore original uploaded households so questionnaire shows all questions
      try {
        const raw = sessionStorage.getItem(`fiscalpt-uploaded-${sessionId}`)
        if (raw) {
          uploadedHouseholdsRef.current = JSON.parse(raw) as Household[]
        }
      } catch {}
    }

    // Set URL hash so user can bookmark
    window.history.replaceState(null, '', `#s=${sessionId}`)
  }, [sessionId])

  // Focus main heading after step transitions
  const prevStepRef = useRef(step)
  useEffect(() => {
    if (prevStepRef.current === step) return
    prevStepRef.current = step
    const timer = setTimeout(() => {
      if (!mainContentRef.current) return
      const heading = mainContentRef.current.querySelector<HTMLElement>('h1, h2')
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
        heading.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [step])

  // Focus error banner when it appears
  useEffect(() => {
    if (error && errorBannerRef.current) {
      errorBannerRef.current.focus()
    }
  }, [error])

  // Persist state on every meaningful change
  const persistState = useCallback(
    (
      s: Step,
      hs: Household[],
      rs: AnalysisResult[],
      i: ValidationIssue[],
      l: LiquidacaoParsed | null,
    ) => {
      saveSessionState(sessionId, {
        step: s,
        households: hs,
        results: rs,
        issues: i,
        liquidacao: l,
      })
    },
    [sessionId],
  )

  function handleExtracted(hs: Household[], i: ValidationIssue[], liq?: LiquidacaoParsed) {
    trackEvent('upload_complete', { householdCount: hs.length })
    setHouseholds(hs)
    uploadedHouseholdsRef.current = hs
    try {
      sessionStorage.setItem(`fiscalpt-uploaded-${sessionId}`, JSON.stringify(hs))
    } catch {}
    setIssues(i)
    setResults([])
    const newLiq = liq ?? liquidacao
    if (liq) setLiquidacao(liq)
    // Reset to questionnaire — force fresh start since documents changed
    const qIdx = STEPS.indexOf('questionnaire')
    setStep('questionnaire')
    setFurthestStep(qIdx)
    setError(null)
    persistState('questionnaire', hs, [], i, newLiq)
  }

  // Project next year's taxes if primary year is current or last year
  const projectionYear = (() => {
    if (!primaryHousehold) return undefined
    const currentYear = new Date().getFullYear()
    if (primaryHousehold.year >= currentYear - 1) return primaryHousehold.year + 1
    return undefined
  })()

  function handleQuestionnaireComplete(h: Household, projectedHousehold?: Household) {
    trackEvent('questionnaire_complete')
    // Strip any previously-appended projected households before rebuilding
    const nonProjected = households.filter((hh) => !hh.projected)
    // Update primary household, propagate, then analyze all
    const allHouseholds = nonProjected.map((hh, idx) => {
      if (idx === 0) return h
      const propagated = propagateSharedData(h, hh)
      // Log propagation details for debugging
      console.info(
        `[FiscalPT] Propagation year ${hh.year}:`,
        hh.members.map(
          (m, mi) =>
            `target[${mi}]=${m.name}(nif=${m.nif ?? '?'}, regimes=[${m.special_regimes}], nhr_confirmed=${m.nhr_confirmed}) → ` +
            `result regimes=[${propagated.members[mi]?.special_regimes}], nhr_confirmed=${propagated.members[mi]?.nhr_confirmed}`,
        ),
      )
      return propagated
    })
    if (projectedHousehold) allHouseholds.push(projectedHousehold)
    computeAndShowResults(allHouseholds)
  }

  function handleQuestionnaireSkip() {
    computeAndShowResults(households.filter((hh) => !hh.projected))
  }

  function computeAndShowResults(allHouseholds: Household[]) {
    // Validate but never block — the engine sanitizes values and produces
    // the best result it can. Surface issues as warnings alongside results.
    const freshErrors = allHouseholds.flatMap((hh) => validateHousehold(hh))
    const validationWarnings: ValidationIssue[] = freshErrors
      .filter((e) => e.severity === 'error')
      .map((e) => ({
        severity: 'warning' as const,
        code: e.code,
        message: e.message,
        details: e.field,
      }))
    if (validationWarnings.length > 0) {
      setIssues((prev) => {
        const existing = new Set(prev.map((i) => `${i.code}:${i.message}`))
        return [
          ...prev,
          ...validationWarnings.filter((w) => !existing.has(`${w.code}:${w.message}`)),
        ]
      })
    }

    setCalculating(true)
    setError(null)
    try {
      // Separate projected from non-projected households
      const nonProjected = allHouseholds.filter((hh) => !hh.projected)
      const projectedRaw = allHouseholds.filter((hh) => hh.projected)

      // Analyze non-projected first
      const allResults: AnalysisResult[] = nonProjected.map((hh) => analyzeHousehold(hh))

      // Enrich projected households with estimated retentions, then analyze
      const primaryHH = nonProjected[0]
      const primaryResult = allResults.find((r) => r.year === primaryHH?.year)
      const enrichedHouseholds = [...nonProjected]

      for (const proj of projectedRaw) {
        const enriched =
          primaryHH && primaryResult
            ? estimateProjectedRetentions(proj, primaryHH, primaryResult)
            : proj
        enrichedHouseholds.push(enriched)
        allResults.push(analyzeHousehold(enriched))
      }

      // Diagnostic: log per-year member and scenario data (all years including projected)
      for (const r of allResults) {
        const members = r.household.members.map(
          (m) =>
            `${m.name}(nif=${m.nif ?? '?'}, nhr=${m.special_regimes.includes('nhr')}, ` +
            `nhr_confirmed=${m.nhr_confirmed ?? false}, nhr_start=${m.nhr_start_year ?? '?'}, ` +
            `regimes=[${m.special_regimes.join(',')}], ` +
            `irs_jovem_year=${m.irs_jovem_year ?? '?'}, first_work=${m.irs_jovem_first_work_year ?? '?'})`,
        )
        const burdens = r.scenarios.map(
          (s) => `${s.filing_status}=${s.total_tax_burden.toFixed(2)}`,
        )
        const personRates = r.scenarios[0]?.persons.map(
          (p) =>
            `${p.name}: gross=${p.gross_income}, taxable=${p.taxable_income}, ` +
            `rate=${(p.effective_rate_irs * 100).toFixed(2)}%, ` +
            `irs_jovem_exempt=${p.irs_jovem_exemption.toFixed(2)}, ` +
            `nhr_tax=${p.nhr_tax.toFixed(2)}, irs_after=${p.irs_after_deductions.toFixed(2)}`,
        )
        console.info(
          `[FiscalPT] Year ${r.year} (${r.household.projected ? 'projected' : 'real'}):`,
          `\n  members: ${members.join('; ')}`,
          `\n  filing: ${r.household.filing_status}`,
          `\n  scenarios: [${burdens.join(', ')}]`,
          `\n  person rates: [${personRates?.join('; ') ?? 'n/a'}]`,
          `\n  optimizations: ${r.optimizations.length}`,
        )
      }

      setHouseholds(enrichedHouseholds)

      // Cross-validate primary year against liquidação if available
      if (liquidacao && primaryResult && primaryResult.scenarios.length > 0) {
        const validation = validateAgainstLiquidacao(liquidacao, primaryResult.scenarios[0])
        if (!validation.isValid) {
          setIssues((prev) => [...prev, ...validation.issues])
        }
      }

      setResults(allResults)
      trackEvent('results_viewed', { scenarioCount: allResults.length })
      advanceStep('results')
      persistState('results', enrichedHouseholds, allResults, issues, liquidacao)
    } catch (err) {
      const message = err instanceof Error ? err.message : t('analyze.calcError')
      setError(message)
      setIssues((prev) =>
        prev.some((i) => i.message === message)
          ? prev
          : [
              ...prev,
              {
                severity: 'error' as const,
                code: 'CALC_ERROR',
                message: t('analyze.calcErrorPrefix', { message }),
              },
            ],
      )
      setStep('questionnaire')
    } finally {
      setCalculating(false)
    }
  }

  function handleClearAll() {
    setStep('upload')
    setHouseholds([])
    uploadedHouseholdsRef.current = []
    setResults([])
    setIssues([])
    setLiquidacao(null)
    setError(null)
    setFurthestStep(0)
    clearSessionState(sessionId)
    // Clear cached questionnaire data
    try {
      sessionStorage.removeItem(`fiscalpt-uploaded-${sessionId}`)
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('fiscalpt-answers-') || key.startsWith('fiscalpt-projection-')) {
          sessionStorage.removeItem(key)
        }
      }
    } catch {}
    // Clear URL hash
    window.history.replaceState(null, '', window.location.pathname)
  }

  const currentStepIdx = STEPS.indexOf(step)

  return (
    <div className="flex flex-col min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Saltar para o conteúdo principal
      </a>
      {step === 'upload' && <OnboardingOverlay />}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">FiscalPT</span>
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('common.back')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 py-8 md:py-12">
        <ErrorBoundary>
          <div ref={mainContentRef} className="mx-auto max-w-4xl px-4">
            {/* Step indicator */}
            <nav
              className="mb-8 flex items-center justify-center gap-2"
              aria-label={t('analyze.progressLabel')}
            >
              {STEPS.map((s, i) => {
                const isVisited = i <= furthestStep && i < currentStepIdx
                const isCurrent = i === currentStepIdx
                const stepLabel = t('analyze.stepLabel', {
                  step: i + 1,
                  name: t(STEP_LABEL_KEYS[s]),
                })
                return (
                  <div key={s} className="flex items-center gap-2">
                    {isVisited ? (
                      <button
                        type="button"
                        onClick={() => goToStep(s)}
                        className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
                        aria-label={t('analyze.stepCompleted', { label: stepLabel })}
                      >
                        <span>{i + 1}</span>
                        <span className="hidden sm:inline">{t(STEP_LABEL_KEYS[s])}</span>
                      </button>
                    ) : (
                      <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        aria-current={isCurrent ? 'step' : undefined}
                        aria-label={stepLabel}
                      >
                        <span>{i + 1}</span>
                        <span className="hidden sm:inline">{t(STEP_LABEL_KEYS[s])}</span>
                      </div>
                    )}
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-px w-6 ${i < currentStepIdx ? 'bg-primary/40' : 'bg-muted'}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Error banner */}
            {error && (
              <div
                ref={errorBannerRef}
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4"
              >
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t('analyze.errorTitle')}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-600"
                >
                  {t('common.close')}
                </Button>
              </div>
            )}

            {/* Loading skeleton */}
            {calculating && (
              <div role="status" aria-live="polite">
                <ResultsSkeleton />
              </div>
            )}

            {!calculating && step === 'upload' && (
              <div data-testid="step-upload">
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {t('analyze.title')}
                  </h1>
                  <p className="mt-2 text-muted-foreground">{t('analyze.subtitle')}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1">
                    <ShieldCheck
                      className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      {t('privacy.badge')}
                    </span>
                  </div>
                </div>
                {households.length > 0 ? (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle
                          className="h-5 w-5 text-green-600 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {t('analyze.docsLoaded')}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            {primaryHousehold!.members.map((m) => m.name).join(' e ')} —{' '}
                            {households.length === 1
                              ? t('analyze.fiscalYear', { year: primaryHousehold!.year })
                              : t('analyze.fiscalYears', {
                                  count: households.length,
                                  years: households
                                    .map((h) => h.year)
                                    .sort()
                                    .join(', '),
                                })}
                          </p>
                        </div>
                      </div>
                    </div>
                    {issues.filter((i) => i.severity === 'warning').length > 0 && (
                      <div className="space-y-2">
                        {issues
                          .filter((i) => i.severity === 'warning')
                          .map((issue, i) => (
                            <div
                              key={`warn-${i}`}
                              className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3"
                            >
                              <AlertTriangle
                                className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                {issue.message}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setHouseholds([])
                          setResults([])
                          setIssues([])
                          setLiquidacao(null)
                        }}
                        className="w-full sm:w-auto gap-1.5"
                      >
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                        {t('analyze.loadNewDocs')}
                      </Button>
                      <Button
                        onClick={() => advanceStep('questionnaire')}
                        className="w-full sm:w-auto gap-1.5"
                        data-testid="continue-to-questionnaire"
                      >
                        {t('common.continue')}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DocumentUpload onExtracted={handleExtracted} />
                )}
              </div>
            )}

            {!calculating && step === 'questionnaire' && primaryHousehold && (
              <div data-testid="step-questionnaire">
                <HouseholdQuestionnaire
                  household={questionnaireHousehold ?? primaryHousehold}
                  onComplete={handleQuestionnaireComplete}
                  onBack={() => goToStep('upload')}
                  onSkip={handleQuestionnaireSkip}
                  projectionYear={projectionYear}
                  otherYearHouseholds={households.slice(1)}
                />
              </div>
            )}

            {!calculating && step === 'results' && results.length > 0 && (
              <div data-testid="step-results">
                <TaxResults
                  results={results}
                  issues={issues}
                  onBack={() => goToStep('questionnaire')}
                  onReset={handleClearAll}
                  checkoutSessionId={checkoutSessionId}
                  sessionHash={sessionId}
                />
              </div>
            )}
          </div>
        </ErrorBoundary>
      </main>

      <footer className="border-t py-6" aria-label={t('nav.footer')}>
        <div className="mx-auto max-w-6xl px-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('privacy.footerNote')}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/legal/termos" className="hover:text-foreground transition-colors">
              Termos de Serviço
            </Link>
            <Link href="/legal/privacidade" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
            <a
              href="https://github.com/ruifm/fiscalpt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
            <a
              href="mailto:contact@fiscalpt.com"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              Contacto
            </a>
          </nav>
          <p className="text-xs text-muted-foreground">
            {t('common.footer', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

      <FeedbackButton stage={step} />
    </div>
  )
}
