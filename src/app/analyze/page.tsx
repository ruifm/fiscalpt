'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Calculator,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Mail,
  Zap,
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
import { generateSessionId } from '@/lib/session-persistence'
import { ErrorBoundary } from '@/components/error-boundary'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { OnboardingOverlay } from '@/components/onboarding-overlay'
import { FeedbackButton } from '@/components/feedback-button'
import { useT } from '@/lib/i18n'
import { useAnalysisFlow, STEPS, type Step } from '@/hooks/use-analysis-flow'

const STEP_LABEL_KEYS: Record<Step, string> = {
  upload: 'analyze.steps.upload',
  questionnaire: 'analyze.steps.questionnaire',
  results: 'analyze.steps.results',
}

export default function AnalyzePage() {
  const t = useT()

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

  const {
    state,
    primaryHousehold,
    questionnaireHousehold,
    projectionYear,
    handleExtracted,
    handleQuestionnaireComplete,
    handleSkipQuestionnaire,
    handleClearAll,
    goToStep,
    advanceStep,
    dismissError,
  } = useAnalysisFlow({ sessionId, t })

  const { step, households, results, issues, calculating, error, furthestStep } = state

  const mainContentRef = useRef<HTMLDivElement>(null)
  const errorBannerRef = useRef<HTMLDivElement>(null)

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
                <Button variant="ghost" size="sm" onClick={dismissError} className="text-red-600">
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

            <div
              data-testid="step-upload"
              className={calculating || step !== 'upload' ? 'hidden' : undefined}
            >
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
              {step === 'upload' && households.length > 0 && (
                <div className="mb-6 space-y-4">
                  {issues.filter((i) => i.severity === 'warning' || i.severity === 'info').length >
                    0 && (
                    <div className="space-y-2">
                      {issues
                        .filter((i) => i.severity === 'warning' || i.severity === 'info')
                        .map((issue, i) => (
                          <div
                            key={`upload-issue-${i}`}
                            className={`flex items-start gap-2 rounded-lg p-3 ${
                              issue.severity === 'warning'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                                : 'bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800'
                            }`}
                          >
                            {issue.severity === 'warning' ? (
                              <AlertTriangle
                                className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <AlertCircle
                                className="h-4 w-4 text-sky-600 mt-0.5 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  issue.severity === 'warning'
                                    ? 'text-amber-800 dark:text-amber-200'
                                    : 'text-sky-800 dark:text-sky-200'
                                }`}
                              >
                                {issue.message}
                              </p>
                              {issue.code === 'LIQUIDACAO_MISMATCH' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const description = `[Liquidação mismatch] ${issue.message}`
                                    fetch('/api/report-problem', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        description,
                                        stage: 'results-validation',
                                      }),
                                    }).catch(() => {})
                                    const btn = document.activeElement as HTMLButtonElement | null
                                    if (btn) {
                                      btn.textContent = t('analyze.reportSent')
                                      btn.disabled = true
                                    }
                                  }}
                                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline"
                                >
                                  <Mail className="h-3 w-3" aria-hidden="true" />
                                  {t('analyze.reportMismatch')}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleSkipQuestionnaire}
                      className="w-full sm:w-auto gap-1.5"
                      data-testid="skip-to-results"
                    >
                      <Zap className="h-4 w-4" aria-hidden="true" />
                      {t('analyze.skipToResults')}
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
                  <p className="text-center text-xs text-muted-foreground">
                    {t('analyze.skipToResultsDesc')}
                  </p>
                </div>
              )}
              <DocumentUpload onExtracted={handleExtracted} />
            </div>

            {!calculating && step === 'questionnaire' && primaryHousehold && (
              <div data-testid="step-questionnaire">
                {issues.filter(
                  (i) =>
                    (i.severity === 'warning' || i.severity === 'info') &&
                    i.code !== 'APPROXIMATE_RESULTS',
                ).length > 0 && (
                  <div className="space-y-2 mb-4">
                    {issues
                      .filter(
                        (i) =>
                          (i.severity === 'warning' || i.severity === 'info') &&
                          i.code !== 'APPROXIMATE_RESULTS',
                      )
                      .map((issue, i) => (
                        <div
                          key={`q-issue-${i}`}
                          className={`flex items-start gap-2 rounded-lg p-3 ${
                            issue.severity === 'warning'
                              ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                              : 'bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800'
                          }`}
                        >
                          {issue.severity === 'warning' ? (
                            <AlertTriangle
                              className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                          ) : (
                            <AlertCircle
                              className="h-4 w-4 text-sky-600 mt-0.5 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <p
                            className={`text-sm ${
                              issue.severity === 'warning'
                                ? 'text-amber-800 dark:text-amber-200'
                                : 'text-sky-800 dark:text-sky-200'
                            }`}
                          >
                            {issue.message}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
                <HouseholdQuestionnaire
                  household={questionnaireHousehold ?? primaryHousehold}
                  onComplete={handleQuestionnaireComplete}
                  onBack={() => goToStep('upload')}
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
