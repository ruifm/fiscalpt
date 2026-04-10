'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Calculator, ArrowLeft, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SimulationForm } from '@/components/simulation-form'
import type { SimulationFormState } from '@/components/simulation-form'
import { ResultsSkeleton } from '@/components/results-skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { useT } from '@/lib/i18n'
import type { SimulationInputs, SimulationResults } from '@/lib/tax/simulation'
import { computeSimulationResults } from '@/lib/tax/simulation'
import {
  decodeSimulationInputs,
  encodeSimulationInputs,
  inputsToFormState,
} from '@/lib/tax/simulation-share'

const TaxResults = dynamic(() => import('@/components/tax-results').then((mod) => mod.TaxResults), {
  ssr: false,
  loading: () => <ResultsSkeleton />,
})

// ─── localStorage persistence ────────────────────────────────

const STORAGE_KEY = 'fiscalpt-simulation'
const STORAGE_VERSION = 1

interface SimulationStorage {
  version: number
  formState: SimulationFormState
  results?: SimulationResults | null
  inputs?: SimulationInputs | null
  pendingCheckoutSessionId?: string | null
}

function readStorage(): SimulationStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SimulationStorage
    if (data.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function writeStorage(data: SimulationStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

export default function SimulacaoPage() {
  const t = useT()

  // Lazy-read localStorage on mount (sync, no race condition)
  const [stored] = useState<SimulationStorage | null>(() => {
    if (typeof window === 'undefined') return null
    return readStorage()
  })

  // Capture checkout session_id from URL (Stripe redirect) or pending storage
  const [checkoutSessionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('session_id')
    if (fromUrl) {
      // Persist as pending token so it survives further refreshes
      const current = readStorage()
      if (current) {
        writeStorage({ ...current, pendingCheckoutSessionId: fromUrl })
      }
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
      return fromUrl
    }
    // Fall back to pending token from storage
    return readStorage()?.pendingCheckoutSessionId ?? null
  })

  // Capture share param from URL (read once, used in mount effect)
  const [shareParam] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('s')
  })

  // All client-only state starts at defaults to match the server render
  // (avoids hydration mismatch). Restored from localStorage after mount.
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [_inputs, setInputs] = useState<SimulationInputs | null>(null)
  const [formState, setFormState] = useState<SimulationFormState | undefined>(undefined)
  const [formKey, setFormKey] = useState(0)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Restore state from shared link or localStorage after hydration
  useEffect(() => {
    // Share param takes priority over localStorage
    if (shareParam) {
      const decoded = decodeSimulationInputs(shareParam)
      if (decoded) {
        const computed = computeSimulationResults(decoded)
        setResults(computed)
        setInputs(decoded)
        setFormState(inputsToFormState(decoded))
        setFormKey((k) => k + 1)
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname)
        return
      }
    }

    if (stored?.results) {
      setResults(stored.results)
      setInputs(stored.inputs ?? null)
    }
    if (stored?.formState) {
      setFormState(stored.formState)
      // Force form remount with restored state
      setFormKey((k) => k + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, [])

  const handleResults = useCallback((r: SimulationResults, i: SimulationInputs) => {
    setResults(r)
    setInputs(i)
    // Persist results alongside form state
    const current = readStorage()
    if (current) {
      writeStorage({ ...current, results: r, inputs: i })
    }
  }, [])

  // Scroll to results when they appear
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [results])

  const handleBack = useCallback(() => {
    setResults(null)
    setInputs(null)
    // Clear results from storage, keep form state
    const current = readStorage()
    if (current) {
      writeStorage({ ...current, results: null, inputs: null })
    }
  }, [])

  const handleReset = useCallback(() => {
    setResults(null)
    setInputs(null)
    setFormState(undefined)
    setFormKey((k) => k + 1)
    clearStorage()
  }, [])

  const handlePaywallUnlock = useCallback(() => {
    // Clear pending checkout token — session consumed
    const current = readStorage()
    if (current) {
      writeStorage({ ...current, pendingCheckoutSessionId: null })
    }
  }, [])

  const [shareCopied, setShareCopied] = useState(false)

  const handleShare = useCallback(() => {
    if (!_inputs) return
    const encoded = encodeSimulationInputs(_inputs)
    const url = `${window.location.origin}/simulacao?s=${encoded}`

    // Try Web Share API first (mobile), fall back to clipboard
    if (navigator.share) {
      navigator.share({ title: 'FiscalPT — Simulação', url }).catch(() => {
        // User cancelled or share failed — fall back to clipboard
        void navigator.clipboard.writeText(url)
      })
      return
    }

    void navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }, [_inputs])

  const handleFormStateChange = useCallback((state: SimulationFormState) => {
    setFormState(state)
    // Preserve existing results when only form state changes
    const current = readStorage()
    writeStorage({
      version: STORAGE_VERSION,
      formState: state,
      results: current?.results ?? null,
      inputs: current?.inputs ?? null,
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calculator className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-xl font-bold tracking-tight">FiscalPT</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <Link href="/analyze">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t('simulation.switchToFull')}</span>
              </Button>
            </Link>
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

      <main className="flex-1 py-8 md:py-12">
        <div className="mx-auto max-w-2xl px-4">
          {!results ? (
            <>
              {/* Title */}
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t('simulation.title')}
                </h1>
                <p className="mt-2 text-muted-foreground">{t('simulation.subtitle')}</p>
              </div>

              {/* Form */}
              <SimulationForm
                key={formKey}
                onResults={handleResults}
                initialState={formState}
                onStateChange={handleFormStateChange}
              />

              {/* Disclaimer */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t('simulation.disclaimer')}
              </p>
            </>
          ) : (
            <div ref={resultsRef}>
              <TaxResults
                results={[results.optimized]}
                issues={[]}
                onBack={handleBack}
                onReset={handleReset}
                onShare={handleShare}
                checkoutSessionId={checkoutSessionId}
                returnPath="/simulacao"
                onPaywallUnlock={handlePaywallUnlock}
                simulationMode
                simulationSavings={results.total_savings}
                currentResult={results.current}
              />

              {/* Share feedback */}
              {shareCopied && (
                <p className="mt-2 text-center text-sm font-medium text-green-600 dark:text-green-400">
                  ✓ {t('simulation.shareCopied')}
                </p>
              )}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t('simulation.shareNote')}
              </p>

              {/* Conversion CTA — full analysis */}
              <div className="mt-8">
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
                  <CardContent className="relative space-y-3 p-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                      <h3 className="font-semibold">{t('simulation.fullAnalysisCta')}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('simulation.fullAnalysisDesc')}
                    </p>
                    <Link href="/analyze">
                      <Button variant="outline" size="sm" className="w-full gap-1.5">
                        {t('simulation.switchToFull')}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Disclaimer */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {t('simulation.disclaimer')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          {t('common.footer', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  )
}
